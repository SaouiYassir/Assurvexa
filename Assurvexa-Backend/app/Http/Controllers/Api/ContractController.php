<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContractStatus;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ContractController extends Controller
{
    /**
     * Display a listing of contracts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contract::with([
            'customer.user',
            'agent.user',
            'policy',
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

        $search = $request->validate(['search' => ['sometimes', 'nullable', 'string', 'max:100']])['search'] ?? '';
        if ($search !== '') {
            $query->where(function ($match) use ($search) {
                $match->whereHas('policy', fn ($policy) => $policy->whereLike('nom', "%{$search}%"));
                if (ctype_digit($search)) {
                    $match->orWhere('id', (int) $search);
                }
            });
        }

        $contracts = $query->latest()->orderByDesc('id')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $contracts,
        ], 200);
    }

    /**
     * Store a newly created contract.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'agent', 403,
            'Only agents can create contracts.');

        $agent = $user->agent;
        abort_unless($agent, 403, 'Agent profile not found.');

        $validated = $request->validate([
            'customer_id' => [
                'required',
                'exists:customers,id',
            ],
            'agent_id' => [
                'sometimes',
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
            'status' => [
                'required',
                Rule::enum(ContractStatus::class),
            ],
        ]);

        if (isset($validated['agent_id']) && (int) $validated['agent_id'] !== (int) $agent->id) {
            return response()->json([
                'success' => false,
                'message' => 'Agents can only create contracts assigned to themselves.',
            ], 403);
        }

        $contract = $agent->contracts()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contract created successfully.',
            'data' => $contract->load([
                'customer.user',
                'agent.user',
                'policy',
            ]),
        ], 201);
    }

    /**
     * Display the specified contract.
     */
    public function show(Request $request, Contract $contract): JsonResponse
    {
        $this->ensureCanView($request, $contract);

        $contract->load([
            'customer.user',
            'agent.user',
            'policy',
        ]);

        return response()->json([
            'success' => true,
            'data' => $contract,
        ], 200);
    }

    /**
     * Update the specified contract.
     */
    public function update(Request $request, Contract $contract): JsonResponse
    {
        abort_unless($request->user()->role === 'agent', 403,
            'Only agents can update contracts.');

        if ($request->user()->role === 'agent' &&
            $contract->agent_id !== $request->user()->agent?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update contracts assigned to you.',
            ], 403);
        }

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
            'status' => [
                'sometimes',
                'required',
                Rule::enum(ContractStatus::class),
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
                    'The end date must be after or equal to the start date.',
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
                'policy',
            ]),
        ], 200);
    }

    /**
     * Remove the specified contract.
     */
    public function destroy(Request $request, Contract $contract): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'agent' && $contract->agent_id === $user->agent?->id, 403,
            'You can only delete contracts assigned to you.');

        $contract->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contract deleted successfully.',
        ], 200);
    }

    private function ensureCanView(Request $request, Contract $contract): void
    {
        $user = $request->user();

        $allowed = $user->role === 'admin'
            || ($user->role === 'customer' && $contract->customer_id === $user->customer?->id)
            || ($user->role === 'agent' && $contract->agent_id === $user->agent?->id);

        abort_unless($allowed, 403, 'You are not allowed to view this contract.');
    }
}
