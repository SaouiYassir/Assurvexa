<?php

namespace App\Http\Controllers\Api;

use App\Enums\ClaimStatus;
use App\Enums\PaiementMethod;
use App\Enums\PaiementStatus;
use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Reimbursement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class ReimbursementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Reimbursement::with(['claim']);

        if ($request->user()->role === 'customer') {
            $customerId = $request->user()->customer?->id;
            abort_unless($customerId, 403, 'Customer profile not found.');
            $query->whereHas('claim', fn ($claims) => $claims
                ->where('customer_id', $customerId));
        } elseif ($request->user()->role === 'agent') {
            $agentId = $request->user()->agent?->id;
            abort_unless($agentId, 403, 'Agent profile not found.');
            $query->whereHas('claim', fn ($claims) => $claims
                ->where('agent_id', $agentId));
        }

        $reimbursements = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $reimbursements,
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        abort_unless(in_array($request->user()->role, ['admin', 'agent'], true), 403,
            'Only agents and administrators can issue reimbursements.');

        $validated = $request->validate([
            'claim_id' => [
                'required',
                'exists:claims,id',
                'unique:reimbursements,claim_id',
            ],
            'prix' => [
                'required',
                'numeric',
                'min:0.01',
            ],
            'methode_paiement' => [
                'required',
                new Enum(PaiementMethod::class),
            ],
            'status_paiement' => [
                'required',
                new Enum(PaiementStatus::class),
            ],
            'date_paiement' => [
                'nullable',
                'date',
            ],
        ]);

        $claim = Claim::findOrFail($validated['claim_id']);

        if ($request->user()->role === 'agent' &&
            $claim->agent_id !== $request->user()->agent?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only issue reimbursements for your assigned claims.',
            ], 403);
        }

        if ($claim->status !== ClaimStatus::APPROVED) {
            return response()->json([
                'success' => false,
                'message' => 'A reimbursement can only be issued for an approved claim.',
            ], 422);
        }

        $reimbursement = Reimbursement::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reimbursement created successfully.',
            'data' => $reimbursement->load('claim'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Reimbursement $reimbursement)
    {
        $claim = $reimbursement->claim;
        $user = $request->user();
        $allowed = $user->role === 'admin'
            || ($user->role === 'customer' && $claim->customer_id === $user->customer?->id)
            || ($user->role === 'agent' && $claim->agent_id === $user->agent?->id);

        abort_unless($allowed, 403, 'You are not allowed to view this reimbursement.');

        $reimbursement->load('claim');

        return response()->json([
            'success' => true,
            'data' => $reimbursement,
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Reimbursement $reimbursement)
    {
        abort_unless(in_array($request->user()->role, ['admin', 'agent'], true), 403,
            'Only agents and administrators can update reimbursements.');

        $validated = $request->validate([
            'claim_id' => [
                'sometimes',
                'required',
                'exists:claims,id',
                Rule::unique('reimbursements', 'claim_id')
                    ->ignore($reimbursement->id),
            ],
            'prix' => [
                'sometimes',
                'required',
                'numeric',
                'min:0.01',
            ],
            'methode_paiement' => [
                'sometimes',
                'required',
                new Enum(PaiementMethod::class),
            ],
            'status_paiement' => [
                'sometimes',
                'required',
                new Enum(PaiementStatus::class),
            ],
            'date_paiement' => [
                'sometimes',
                'nullable',
                'date',
            ],
        ]);

        $claim = Claim::findOrFail($validated['claim_id'] ?? $reimbursement->claim_id);

        if ($request->user()->role === 'agent' &&
            $claim->agent_id !== $request->user()->agent?->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update reimbursements for your assigned claims.',
            ], 403);
        }

        if ($claim->status !== ClaimStatus::APPROVED) {
            return response()->json([
                'success' => false,
                'message' => 'A reimbursement can only reference an approved claim.',
            ], 422);
        }

        $reimbursement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reimbursement updated successfully.',
            'data' => $reimbursement->fresh()->load('claim'),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Reimbursement $reimbursement)
    {
        $reimbursement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Reimbursement deleted successfully.',
        ], 200);
    }
}
