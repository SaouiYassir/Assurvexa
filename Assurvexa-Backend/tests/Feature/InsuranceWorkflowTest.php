<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\User;

class InsuranceWorkflowTest extends ApiTestCase
{
    public function test_agent_creates_a_contract_from_the_dashboard_payload(): void
    {
        $agent = $this->createAgent();
        $otherAgent = $this->createAgent();
        $customer = $this->createCustomer();
        $policy = $this->createPolicy();
        $payload = [
            'customer_id' => $customer->id,
            'policy_id' => $policy->id,
            'date_debut' => '2025-01-01',
            'date_fin' => '2027-01-01',
            'status' => 'pending',
        ];

        $this->authenticateAs($customer->user);
        $this->postJson('/api/contracts', $payload)->assertForbidden();

        $this->authenticateAs($agent->user);
        $this->postJson('/api/contracts', array_replace($payload, ['date_fin' => '2024-12-31']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date_fin');
        $this->postJson('/api/contracts', $payload + ['agent_id' => $otherAgent->id])
            ->assertForbidden();
        $this->assertDatabaseCount('contracts', 0);

        $id = $this->postJson('/api/contracts', $payload)
            ->assertCreated()
            ->assertJsonPath('data.agent_id', $agent->id)
            ->json('data.id');

        $this->assertDatabaseHas('contracts', [
            'id' => $id,
            'agent_id' => $agent->id,
            'customer_id' => $customer->id,
            'policy_id' => $policy->id,
            'status' => 'pending',
        ]);
    }

    public function test_customer_and_agent_complete_a_claim_and_reimbursement(): void
    {
        $policy = $this->createPolicy();
        $contract = $this->createContract($this->createAgent(), $policy);
        $otherContract = $this->createContract($this->createAgent(), $policy);
        $claimPayload = [
            'contract_id' => $contract->id,
            'description' => 'Windshield damage',
            'incident_date' => '2025-05-01',
            'prix_estime' => 500,
        ];

        $this->authenticateAs($otherContract->customer->user);
        $this->postJson('/api/claims', $claimPayload)->assertForbidden();

        $this->authenticateAs($contract->customer->user);
        $claimId = $this->postJson('/api/claims', $claimPayload)
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.agent_id', $contract->agent_id)
            ->json('data.id');
        $this->putJson("/api/claims/{$claimId}", ['description' => 'Cracked windshield'])
            ->assertOk()
            ->assertJsonPath('data.description', 'Cracked windshield');

        $payment = [
            'claim_id' => $claimId,
            'prix' => 250,
            'methode_paiement' => 'cash',
            'status_paiement' => 'paid',
        ];

        $this->authenticateAs($otherContract->agent->user);
        $this->putJson("/api/claims/{$claimId}", ['status' => 'approved'])->assertForbidden();
        $this->postJson('/api/reimbursements', $payment)->assertForbidden();

        $this->authenticateAs($contract->agent->user);
        $this->postJson('/api/reimbursements', $payment)->assertUnprocessable();
        $this->putJson("/api/claims/{$claimId}", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
        $paymentId = $this->postJson('/api/reimbursements', $payment)
            ->assertCreated()
            ->assertJsonPath('data.claim_id', $claimId)
            ->json('data.id');
        $this->postJson('/api/reimbursements', $payment)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('claim_id');

        $this->authenticateAs($otherContract->customer->user);
        $this->getJson("/api/reimbursements/{$paymentId}")->assertForbidden();

        $this->authenticateAs($contract->customer->user);
        $this->putJson("/api/claims/{$claimId}", ['description' => 'Changed after review'])
            ->assertUnprocessable();
        $this->getJson("/api/reimbursements/{$paymentId}")
            ->assertOk()
            ->assertJsonPath('data.status_paiement', 'paid');
        $this->assertDatabaseCount('reimbursements', 1);
    }

    public function test_dashboard_statistics_follow_the_signed_in_role_and_assignment(): void
    {
        $policy = $this->createPolicy();
        $owned = $this->createContract($this->createAgent(), $policy);
        $other = $this->createContract($this->createAgent(), $policy);

        foreach ([$owned, $other] as $contract) {
            $contract->agent->claims()->create([
                'contract_id' => $contract->id,
                'customer_id' => $contract->customer_id,
                'description' => 'Windshield damage',
                'incident_date' => '2025-05-01',
                'prix_estime' => 500,
                'status' => 'pending',
            ]);
        }

        $this->getJson('/api/dashboard/statistics')->assertUnauthorized();

        $this->authenticateAs($owned->agent->user);
        $this->getJson('/api/dashboard/statistics')
            ->assertOk()
            ->assertJsonPath('role', 'agent')
            ->assertJsonPath('data.totals.active_contracts', 1)
            ->assertJsonPath('data.totals.pending_claims', 1)
            ->assertJsonPath('data.action_required_claims.0.contract_id', $owned->id)
            ->assertJsonCount(1, 'data.action_required_claims');

        $this->authenticateAs($owned->customer->user);
        $this->getJson('/api/dashboard/statistics')
            ->assertOk()
            ->assertJsonPath('role', 'customer')
            ->assertJsonPath('data.totals.total_claims', 1)
            ->assertJsonPath('data.active_contracts.0.id', $owned->id)
            ->assertJsonCount(1, 'data.active_contracts');

        $this->authenticateAs($policy->admin->user);
        $this->getJson('/api/dashboard/statistics')
            ->assertOk()
            ->assertJsonPath('role', 'admin')
            ->assertJsonPath('data.totals.contracts', 2)
            ->assertJsonPath('data.totals.claims', 2);
    }

    public function test_only_the_assigned_agent_can_delete_a_contract_and_its_related_records(): void
    {
        $contract = $this->createContract($this->createAgent(), $this->createPolicy());
        $claim = $contract->agent->claims()->create([
            'contract_id' => $contract->id,
            'customer_id' => $contract->customer_id,
            'description' => 'Windshield damage',
            'incident_date' => '2025-05-01',
            'prix_estime' => 500,
            'status' => 'approved',
        ]);
        $reimbursement = $claim->reimbursement()->create([
            'prix' => 250,
            'methode_paiement' => 'cash',
            'status_paiement' => 'paid',
        ]);

        $this->authenticateAs($this->createAgent()->user);
        $this->deleteJson("/api/contracts/{$contract->id}")->assertForbidden();
        $this->assertModelExists($contract);
        $this->assertModelExists($claim);
        $this->assertModelExists($reimbursement);

        $this->authenticateAs($contract->agent->user);
        $this->deleteJson("/api/contracts/{$contract->id}")->assertOk();
        $this->assertModelMissing($contract);
        $this->assertModelMissing($claim);
        $this->assertModelMissing($reimbursement);
    }

    private function createAgent(): Agent
    {
        return User::factory()->create(['role' => 'agent'])->agent()->create([
            'date_integration' => '2025-01-01',
        ]);
    }

    private function createCustomer(): Customer
    {
        return User::factory()->create(['role' => 'customer'])->customer()->create([
            'adresse' => '10 Main Street',
        ]);
    }

    private function createPolicy(): Policy
    {
        return User::factory()->create(['role' => 'admin'])->admin()->create()->policies()->create([
            'nom' => 'Road cover',
            'description' => 'Standard automobile cover',
            'type' => 'automobile',
            'prix' => 500,
        ]);
    }

    private function createContract(Agent $agent, Policy $policy): Contract
    {
        return $agent->contracts()->create([
            'customer_id' => $this->createCustomer()->id,
            'policy_id' => $policy->id,
            'date_debut' => '2025-01-01',
            'date_fin' => '2027-01-01',
            'status' => 'active',
        ]);
    }
}
