<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\ClaimStatus;
use App\Models\Claim;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ClaimController extends Controller
{
    /**
     * Display a listing of claims.
     */
    public function index(): JsonResponse
    {
        $claims = Claim::with([
            'contract',
            'agent.user',
            'customer.user'
        ])->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $claims
        ], 200);
    }

    /**
     * Store a newly created claim.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contract_id' => [
                'required',
                'exists:contracts,id',
            ],
            'description' => [
                'required',
                'string',
            ],
            'incident_date' => [
                'required',
                'date',
            ],
            'prix_estime' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);

        // Retrieve the contract and its associated agent/customer.
        $contract = Contract::findOrFail($validated['contract_id']);

        $claim = Claim::create([
            'contract_id' => $contract->id,
            'agent_id' => $contract->agent_id,
            'customer_id' => $contract->customer_id,
            'description' => $validated['description'],
            'incident_date' => $validated['incident_date'],
            'prix_estime' => $validated['prix_estime'],
            'status' => ClaimStatus::PENDING,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Claim created successfully.',
            'data' => $claim->load([
                'contract',
                'agent.user',
                'customer.user'
            ]),
        ], 201);
    }

    /**
     * Display the specified claim.
     */
    public function show(Claim $claim): JsonResponse
    {
        $claim->load([
            'contract',
            'agent.user',
            'customer.user'
        ]);

        return response()->json([
            'success' => true,
            'data' => $claim
        ], 200);
    }

    /**
     * Update the specified claim.
     */
    public function update(Request $request, Claim $claim): JsonResponse
    {
        $validated = $request->validate([
            'description' => [
                'sometimes',
                'required',
                'string',
            ],
            'incident_date' => [
                'sometimes',
                'required',
                'date',
            ],
            'prix_estime' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],
            'status' => [
                'sometimes',
                'required',
                Rule::enum(ClaimStatus::class),
            ],
            'decision_note' => [
                'sometimes',
                'nullable',
                'string',
            ],
            'date_review' => [
                'sometimes',
                'nullable',
                'date',
            ],
        ]);

        $claim->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Claim updated successfully.',
            'data' => $claim->fresh()->load([
                'contract',
                'agent.user',
                'customer.user'
            ]),
        ], 200);
    }

    /**
     * Remove the specified claim.
     */
    public function destroy(Claim $claim): JsonResponse
    {
        $claim->delete();

        return response()->json([
            'success' => true,
            'message' => 'Claim deleted successfully.'
        ], 200);
    }
}
