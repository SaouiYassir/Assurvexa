<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reimbursement;
use App\Models\Claim;
use App\Enums\PaiementMethod;
use App\Enums\PaiementStatus;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rule;

class ReimbursementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $reimbursements = Reimbursement::with([
            'claim'
        ])->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $reimbursements
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
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

        $reimbursement = Reimbursement::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reimbursement created successfully.',
            'data' => $reimbursement->load('claim')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Reimbursement $reimbursement)
    {
        $reimbursement->load('claim');

        return response()->json([
            'success' => true,
            'data' => $reimbursement
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Reimbursement $reimbursement)
    {
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

        $reimbursement->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reimbursement updated successfully.',
            'data' => $reimbursement->fresh()->load('claim')
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
            'message' => 'Reimbursement deleted successfully.'
        ], 200);
    }
}
