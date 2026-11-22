<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;

class AccountAndCatalogTest extends ApiTestCase
{
    public function test_login_issues_a_cookie_that_authenticates_the_user(): void
    {
        $customer = $this->createCustomer();
        $response = $this->postJson('/api/login', [
            'email' => $customer->user->email,
            'password' => 'password',
        ])->assertOk()->assertCookie(config('jwt.cookie'));
        $cookie = $response->getCookie(config('jwt.cookie'), false);
        $this->assertTrue($cookie->isHttpOnly());

        $this->withCredentials()->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.id', $customer->user_id);
    }

    public function test_repeated_login_attempts_are_throttled(): void
    {
        $credentials = ['email' => 'missing@example.com', 'password' => 'wrong'];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', $credentials)->assertUnprocessable();
        }

        $this->postJson('/api/login', $credentials)->assertTooManyRequests();
    }

    public function test_customers_can_read_and_update_only_their_own_profile(): void
    {
        $customer = $this->createCustomer();
        $other = $this->createCustomer();
        $this->authenticateAs($customer->user);

        $this->getJson('/api/customers')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $customer->id);
        $this->getJson("/api/customers/{$customer->id}")->assertOk();
        $this->getJson("/api/customers/{$other->id}")->assertForbidden();
        $this->putJson("/api/customers/{$other->id}", ['adresse' => 'New address'])->assertForbidden();
        $this->assertDatabaseHas('customers', ['id' => $other->id, 'adresse' => '10 Main Street']);

        $this->putJson("/api/customers/{$customer->id}", [
            'first_name' => 'Updated',
            'adresse' => '20 Main Street',
            'role' => 'admin',
        ])->assertOk()
            ->assertJsonPath('data.user.first_name', 'Updated')
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonPath('data.adresse', '20 Main Street');
    }

    public function test_staff_can_update_customer_profiles(): void
    {
        $customer = $this->createCustomer();

        foreach (['agent', 'admin'] as $role) {
            $this->authenticateAs(User::factory()->create(['role' => $role]));
            $this->putJson("/api/customers/{$customer->id}", ['adresse' => "Updated by {$role}"])
                ->assertOk()
                ->assertJsonPath('data.adresse', "Updated by {$role}");
        }
    }

    public function test_each_authenticated_role_can_update_its_own_profile(): void
    {
        $this->patchJson('/api/me', ['first_name' => 'Updated'])->assertUnauthorized();

        foreach (['admin', 'agent', 'customer'] as $role) {
            $user = $role === 'customer'
                ? $this->createCustomer()->user
                : User::factory()->create(['role' => $role]);
            $this->authenticateAs($user);

            $this->patchJson('/api/me', [
                'first_name' => 'Updated',
                'email' => "updated-{$role}@example.test",
                'adresse' => '20 Main Street',
                'role' => 'unknown',
            ])->assertOk()
                ->assertJsonPath('user.id', $user->id)
                ->assertJsonPath('user.role', $role)
                ->assertJsonMissingPath('user.password');

            $profile = $this->getJson('/api/me')->assertOk()
                ->assertJsonPath('user.first_name', 'Updated')
                ->assertJsonPath('user.email', "updated-{$role}@example.test")
                ->assertJsonPath('user.email_verified_at', null);

            if ($role === 'customer') {
                $profile->assertJsonPath('user.customer.adresse', '20 Main Street');
            }
        }
    }

    public function test_invalid_profile_changes_are_rejected_without_saving_address(): void
    {
        $customer = $this->createCustomer();
        $otherUser = User::factory()->create();
        $this->authenticateAs($customer->user);

        $this->patchJson('/api/me', [
            'email' => $otherUser->email,
            'username' => $otherUser->username,
            'CIN' => $otherUser->CIN,
            'adresse' => '20 Main Street',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'username', 'CIN']);

        $this->assertSame('10 Main Street', $customer->refresh()->adresse);
    }

    public function test_policy_catalog_paginates_and_omits_administrator_personal_data(): void
    {
        $admin = User::factory()->create(['role' => 'admin'])->admin()->create();
        for ($number = 1; $number <= 11; $number++) {
            $policy = $admin->policies()->create([
                'nom' => "Policy {$number}",
                'description' => 'Standard automobile cover',
                'type' => 'automobile',
                'prix' => 500,
            ]);
        }
        $this->authenticateAs($this->createCustomer()->user);

        $this->getJson('/api/policies?page=2')
            ->assertOk()
            ->assertJsonPath('data.last_page', 2)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $policy->id)
            ->assertJsonMissingPath('data.data.0.admin');
        $this->getJson('/api/policies?search=Policy+11')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.id', $policy->id);
        $this->getJson("/api/policies/{$policy->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.admin');
    }

    public function test_customer_search_finds_profiles_across_pages_by_full_name(): void
    {
        for ($number = 1; $number <= 10; $number++) {
            $this->createCustomer();
        }
        $customer = $this->createCustomer(['first_name' => 'Morgan', 'last_name' => 'Testerson']);
        $this->authenticateAs(User::factory()->create(['role' => 'agent']));

        $this->getJson('/api/customers?page=2')
            ->assertOk()
            ->assertJsonPath('data.data.0.id', $customer->id);
        $this->getJson('/api/customers?search=Morgan+Testerson')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $customer->id);
    }

    private function createCustomer(array $attributes = []): Customer
    {
        return User::factory()->create(['role' => 'customer', ...$attributes])->customer()->create([
            'adresse' => '10 Main Street',
        ]);
    }
}
