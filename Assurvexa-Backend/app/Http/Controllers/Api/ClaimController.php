<?php

namespace App\Http\Controllers\Api;

use App\Enums\ClaimStatus;
use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Contract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClaimController extends Controller
{
    /**
     * Display a listing of claims.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Claim::with([
            'contract',
            'agent.user',
            'customer.user',
        ]);

        if ($request->user()->role === 'customer') {
            $customerId = $request->user()->customer?->id;
            abort_unless($customerId, 403, 'Customer profile not found.');
            $query->where('customer_id', $customerId);
        } elseif ($request->user()->role === 'agent') {
            $agentId = $request->user()->agent?->id;
            abort_unless($agentId, 403, 'Agent profile not found.');
            $query->where('agent_id', $agentId);
        }

        $claims = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $claims,
        ], 200);
    }

    /**
     * Store a newly created claim.
     */
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'customer', 403,
            'Only customers can submit claims.');

        $validated = $request->validate([
            'contract_id' => ['required', 'integer', 'exists:contracts,id'],
            'description' => ['required', 'string'],
            'incident_date' => ['required', 'date', 'before_or_equal:today'], // Good practice!
            'prix_estime' => ['required', 'numeric', 'min:0'],
        ]);

        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer record not found for this user.',
            ], 403);
        }

        // Ensure the contract belongs to this customer
        $contract = $customer->contracts()->find($validated['contract_id']);

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or does not belong to this customer.',
            ], 403);
        }

        $claim = Claim::create([
            'contract_id' => $contract->id,
            'agent_id' => $contract->agent_id,
            'customer_id' => $customer->id,
            'description' => $validated['description'],
            'incident_date' => $validated['incident_date'],
            'prix_estime' => $validated['prix_estime'],
            'status' => ClaimStatus::PENDING,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Claim submitted successfully.',
            'data' => $claim->load([
                'contract',
                'agent.user',
                'customer.user',
            ]),
        ], 201);
    }

    /**
     * Display the specified claim.
     */
    public function show(Request $request, Claim $claim): JsonResponse
    {
        $this->ensureCanView($request, $claim);

        $claim->load([
            'contract',
            'agent.user',
            'customer.user',
        ]);

        return response()->json([
            'success' => true,
            'data' => $claim,
        ], 200);
    }

    /**
     * Update the specified claim.
     */
    public function update(Request $request, Claim $claim): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'agent'], true), 403,
            'Only agents and administrators can review claims.');

        if ($request->user()->role === 'agent' &&
            $claim->agent_id !== $request->user()->agent?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only review claims assigned to you.',
            ], 403);
        }

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
                'customer.user',
            ]),
        ], 200);
    }

    private function ensureCanView(Request $request, Claim $claim): void
    {
        $user = $request->user();

        $allowed = $user->role === 'admin'
            || ($user->role === 'customer' && $claim->customer_id === $user->customer?->id)
            || ($user->role === 'agent' && $claim->agent_id === $user->agent?->id);

        abort_unless($allowed, 403, 'You are not allowed to view this claim.');
    }

    /**
     * Remove the specified claim.
     */
    public function destroy(Claim $claim): JsonResponse
    {
        $claim->delete();

        return response()->json([
            'success' => true,
            'message' => 'Claim deleted successfully.',
        ], 200);
    }
}
