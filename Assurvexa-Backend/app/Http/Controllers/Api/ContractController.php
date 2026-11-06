<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ContractController extends Controller
{
    /**
     * Display a listing of contracts.
     */
    public function index(): JsonResponse
    {
        $contracts = Contract::with([
            'customer.user',
            'agent.user',
            'policy'
        ])->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $contracts
        ], 200);
    }

    /**
     * Store a newly created contract.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => [
                'required',
                'exists:customers,id',
            ],
            'agent_id' => [
                'required',
                'exists:agents,id',
            ],
            'policy_id' => [
                'required',
                'exists:policies,id',
            ],
            'date_debut' => [
                'required',
                'date',
            ],
            'date_fin' => [
                'required',
                'date',
                'after_or_equal:date_debut',
            ],
        ]);

        $contract = Contract::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contract created successfully.',
            'data' => $contract->load([
                'customer.user',
                'agent.user',
                'policy'
            ]),
        ], 201);
    }

    /**
     * Display the specified contract.
     */
    public function show(Contract $contract): JsonResponse
    {
        $contract->load([
            'customer.user',
            'agent.user',
            'policy'
        ]);

        return response()->json([
            'success' => true,
            'data' => $contract
        ], 200);
    }

    /**
     * Update the specified contract.
     */
    public function update(Request $request, Contract $contract): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => [
                'sometimes',
                'required',
                'exists:customers,id',
            ],
            'agent_id' => [
                'sometimes',
                'required',
                'exists:agents,id',
            ],
            'policy_id' => [
                'sometimes',
                'required',
                'exists:policies,id',
            ],
            'date_debut' => [
                'sometimes',
                'required',
                'date',
            ],
            'date_fin' => [
                'sometimes',
                'required',
                'date',
            ],
        ]);

        // Validate the dates together, including partial updates.
        $dateDebut = $validated['date_debut']
            ?? $contract->date_debut->toDateString();

        $dateFin = $validated['date_fin']
            ?? $contract->date_fin->toDateString();

        if (strtotime($dateFin) < strtotime($dateDebut)) {
            throw ValidationException::withMessages([
                'date_fin' => [
                    'The end date must be after or equal to the start date.'
                ],
            ]);
        }

        $contract->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contract updated successfully.',
            'data' => $contract->fresh()->load([
                'customer.user',
                'agent.user',
                'policy'
            ]),
        ], 200);
    }

    /**
     * Remove the specified contract.
     */
    public function destroy(Contract $contract): JsonResponse
    {
        $contract->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contract deleted successfully.'
        ], 200);
    }
}
