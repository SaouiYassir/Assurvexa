<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdministrationTest extends ApiTestCase
{
    public function test_public_registration_creates_a_customer_account(): void
    {
        $profile = [
            'first_name' => 'Sam',
            'last_name' => 'Martin',
            'username' => 'sammartin',
            'CIN' => 'AA12345',
            'phone' => '0600000000',
            'email' => 'sam@example.test',
            'password' => 'example-password',
            'password_confirmation' => 'example-password',
            'adresse' => '10 Main Street',
        ];

        $this->postJson('/api/register', $profile)
            ->assertCreated()
            ->assertJsonPath('customer.user.role', 'customer')
            ->assertJsonMissingPath('customer.user.password')
            ->assertCookieMissing(config('jwt.cookie'));
        $this->postJson('/api/register', $profile)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'username', 'CIN']);

        $user = User::where('email', $profile['email'])->firstOrFail();
        $this->assertTrue(Hash::check($profile['password'], $user->password));
        $this->assertDatabaseHas('customers', [
            'user_id' => $user->id,
            'adresse' => $profile['adresse'],
        ]);
        $this->assertDatabaseCount('customers', 1);
    }

    public function test_only_admins_can_manage_agent_accounts(): void
    {
        $profile = [
            'first_name' => 'Sam',
            'last_name' => 'Martin',
            'username' => 'sammartin',
            'CIN' => 'AA12345',
            'phone' => '0600000000',
            'email' => 'sam@example.test',
            'password' => 'example-password',
            'password_confirmation' => 'example-password',
            'date_integration' => '2025-01-01',
        ];
        $customer = User::factory()->create(['role' => 'customer']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->authenticateAs($customer);
        $this->getJson('/api/agents')->assertForbidden();
        $this->postJson('/api/agents', $profile)->assertForbidden();
        $this->assertDatabaseCount('agents', 0);

        $this->authenticateAs($admin);
        $agentId = $this->postJson('/api/agents', $profile)
            ->assertCreated()
            ->assertJsonPath('data.user.role', 'agent')
            ->assertJsonMissingPath('data.user.password')
            ->json('data.id');
        $this->putJson("/api/agents/{$agentId}", ['first_name' => 'Alex'])
            ->assertOk()
            ->assertJsonPath('data.user.first_name', 'Alex');

        $agent = Agent::findOrFail($agentId);
        $user = $agent->user;
        $this->deleteJson("/api/agents/{$agentId}")->assertOk();
        $this->assertModelMissing($agent);
        $this->assertModelMissing($user);
    }

    public function test_an_admin_can_manage_the_policy_catalog(): void
    {
        $payload = [
            'nom' => 'Road cover',
            'description' => 'Standard automobile cover',
            'type' => 'automobile',
            'prix' => 500,
        ];
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->admin()->create();
        $agent = User::factory()->create(['role' => 'agent']);

        $this->authenticateAs($agent);
        $this->postJson('/api/policies', $payload)->assertForbidden();

        $this->authenticateAs($admin);
        $this->postJson('/api/policies', array_replace($payload, ['prix' => -1]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('prix');
        $policyId = $this->postJson('/api/policies', $payload)
            ->assertCreated()
            ->assertJsonPath('data.nom', 'Road cover')
            ->json('data.id');
        $this->putJson("/api/policies/{$policyId}", ['nom' => 'Premium road cover'])
            ->assertOk()
            ->assertJsonPath('data.nom', 'Premium road cover');

        $this->authenticateAs($agent);
        $this->getJson("/api/policies/{$policyId}")
            ->assertOk()
            ->assertJsonPath('data.nom', 'Premium road cover');
        $this->deleteJson("/api/policies/{$policyId}")->assertForbidden();

        $this->authenticateAs($admin);
        $this->deleteJson("/api/policies/{$policyId}")->assertOk();
        $this->getJson("/api/policies/{$policyId}")->assertNotFound();
    }
}
