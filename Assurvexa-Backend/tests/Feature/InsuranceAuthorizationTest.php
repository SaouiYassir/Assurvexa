<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\Claim;
use App\Models\Contract;
use App\Models\User;

class InsuranceAuthorizationTest extends ApiTestCase
{
    public function test_only_the_assigned_agent_can_delete_a_contract(): void
    {
        $assignedAgent = $this->createAgent();
        $otherAgent = $this->createAgent();
        $contract = $this->createContract($assignedAgent);
        $claim = $this->createApprovedClaim($contract);

        $this->authenticateAs($otherAgent->user);
        $this->deleteJson("/api/contracts/{$contract->id}")->assertForbidden();
        $this->assertModelExists($contract);
        $this->assertModelExists($claim);

        $this->authenticateAs($assignedAgent->user);
        $this->deleteJson("/api/contracts/{$contract->id}")->assertOk();
        $this->assertModelMissing($contract);
        $this->assertModelMissing($claim);
    }

    public function test_reimbursement_updates_require_assignment_to_the_current_and_new_claims(): void
    {
        $assignedAgent = $this->createAgent();
        $otherAgent = $this->createAgent();
        $originalClaim = $this->createApprovedClaim($this->createContract($assignedAgent));
        $otherClaim = $this->createApprovedClaim($this->createContract($otherAgent));
        $replacementClaim = $this->createApprovedClaim($this->createContract($assignedAgent));
        $reimbursement = $originalClaim->reimbursement()->create([
            'prix' => 250,
            'methode_paiement' => 'cash',
            'status_paiement' => 'pending',
        ]);

        $this->authenticateAs($otherAgent->user);
        $this->putJson("/api/reimbursements/{$reimbursement->id}", ['claim_id' => $otherClaim->id])
            ->assertForbidden();

        $this->authenticateAs($assignedAgent->user);
        $this->putJson("/api/reimbursements/{$reimbursement->id}", ['claim_id' => $otherClaim->id])
            ->assertForbidden();
        $this->assertDatabaseHas('reimbursements', [
            'id' => $reimbursement->id,
            'claim_id' => $originalClaim->id,
        ]);

        $this->putJson("/api/reimbursements/{$reimbursement->id}", ['claim_id' => $replacementClaim->id])
            ->assertOk()
            ->assertJsonPath('data.claim_id', $replacementClaim->id);
    }

    public function test_contract_search_keeps_customer_scope(): void
    {
        $agent = $this->createAgent();
        $owned = $this->createContract($agent);
        $other = $this->createContract($agent);
        $this->authenticateAs($owned->customer->user);

        $this->getJson('/api/contracts?search='.$other->id)
            ->assertOk()
            ->assertJsonCount(0, 'data.data');
        $this->getJson('/api/contracts?search='.urlencode($owned->policy->nom))
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $owned->id);
    }

    public function test_reimbursable_claim_search_excludes_paid_claims_and_other_agents(): void
    {
        $agent = $this->createAgent();
        $contract = $this->createContract($agent);
        $eligible = $this->createApprovedClaim($contract);
        $alreadyReimbursed = $this->createApprovedClaim($contract);
        $alreadyReimbursed->reimbursement()->create([
            'prix' => 250,
            'methode_paiement' => 'cash',
            'status_paiement' => 'paid',
        ]);
        $pending = $this->createApprovedClaim($contract);
        $pending->update(['status' => 'pending']);
        $this->createApprovedClaim($this->createContract($this->createAgent()));
        $this->authenticateAs($agent->user);

        $this->getJson('/api/claims?reimbursable=1&search=Windshield')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $eligible->id);
    }

    private function createAgent(): Agent
    {
        return User::factory()->create(['role' => 'agent'])->agent()->create([
            'date_integration' => '2025-01-01',
        ]);
    }

    private function createContract(Agent $agent): Contract
    {
        $customer = User::factory()->create(['role' => 'customer'])->customer()->create([
            'adresse' => '10 Main Street',
        ]);
        $admin = User::factory()->create(['role' => 'admin'])->admin()->create();
        $policy = $admin->policies()->create([
            'nom' => 'Road cover',
            'description' => 'Standard automobile cover',
            'type' => 'automobile',
            'prix' => 500,
        ]);

        return $agent->contracts()->create([
            'customer_id' => $customer->id,
            'policy_id' => $policy->id,
            'date_debut' => '2025-01-01',
            'date_fin' => '2027-01-01',
            'status' => 'active',
        ]);
    }

    private function createApprovedClaim(Contract $contract): Claim
    {
        return Claim::create([
            'contract_id' => $contract->id,
            'agent_id' => $contract->agent_id,
            'customer_id' => $contract->customer_id,
            'description' => 'Windshield damage',
            'incident_date' => '2025-11-01',
            'prix_estime' => 500,
            'status' => 'approved',
        ]);
    }
}
