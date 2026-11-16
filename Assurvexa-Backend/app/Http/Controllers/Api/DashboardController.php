<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Claim;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\Reimbursement;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function statistics(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'totals' => [
                    'agents' => Agent::count(),
                    'customers' => Customer::count(),
                    'policies' => Policy::count(),
                    'contracts' => Contract::count(),
                    'claims' => Claim::count(),
                    'reimbursements' => Reimbursement::count(),
                ],
                'claims_by_status' => Claim::query()
                    ->selectRaw('status, COUNT(*) as total')
                    ->groupBy('status')
                    ->pluck('total', 'status'),
                'reimbursements_by_status' => Reimbursement::query()
                    ->selectRaw('status_paiement, COUNT(*) as total')
                    ->groupBy('status_paiement')
                    ->pluck('total', 'status_paiement'),
            ],
        ]);
    }
}
