<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Claim;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\Reimbursement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = match ($user->role) {
            'admin'    => $this->adminStatistics(),
            'agent'    => $this->agentStatistics($user),
            'customer' => $this->customerStatistics($user),
            default    => abort(403, 'Unauthorized role.'),
        };

        return response()->json([
            'success' => true,
            'role'    => $user->role,
            'data'    => $data,
        ]);
    }

    /**
     * Admin Overview: System-wide KPIs, financial totals, and workload bottlenecks.
     */
    private function adminStatistics(): array
    {
        return [
            'totals' => [
                'agents'         => Agent::count(),
                'customers'      => Customer::count(),
                'policies'       => Policy::count(),
                'contracts'      => Contract::count(),
                'claims'         => Claim::count(),
                'reimbursements' => Reimbursement::count(),
            ],
            'financials' => [
                'total_reimbursed_amount'      => Reimbursement::where('status_paiement', 'paid')->sum('prix'),
                'pending_reimbursement_amount' => Reimbursement::where('status_paiement', 'pending')->sum('prix'),
            ],
            'claims_by_status' => Claim::query()
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'reimbursements_by_status' => Reimbursement::query()
                ->selectRaw('status_paiement, COUNT(*) as total')
                ->groupBy('status_paiement')
                ->pluck('total', 'status_paiement'),
            'recent_claims' => Claim::with(['customer', 'contract'])
                ->latest()
                ->take(5)
                ->get(),
        ];
    }

    /**
     * Agent Overview: Assigned portfolio, pending claims/reimbursements requiring action.
     */
    private function agentStatistics(User $user): array
    {
        $agent = $user->agent; // Assumes User hasOne Agent

        $contractsQuery = Contract::where('agent_id', $agent->id);
        $contractIds = $contractsQuery->pluck('id');

        return [
            'totals' => [
                'my_customers'     => (clone $contractsQuery)->distinct('customer_id')->count('customer_id'),
                'active_contracts' => (clone $contractsQuery)->where('status', 'active')->count(),
                'pending_claims'   => Claim::whereIn('contract_id', $contractIds)->where('status', 'pending')->count(),
                'pending_payments' => Reimbursement::whereHas('claim', fn ($q) => $q->whereIn('contract_id', $contractIds))
                    ->where('status_paiement', 'pending')
                    ->count(),
            ],
            'claims_by_status' => Claim::whereIn('contract_id', $contractIds)
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'action_required_claims' => Claim::with(['customer', 'contract'])
                ->whereIn('contract_id', $contractIds)
                ->where('status', 'pending')
                ->latest()
                ->take(5)
                ->get(),
        ];
    }

    /**
     * Customer Overview: Personal active policies/contracts, claim status, and payouts received.
     */
    private function customerStatistics(User $user): array
    {
        $customer = $user->customer; // Assumes User hasOne Customer

        return [
            'totals' => [
                'active_contracts'   => Contract::where('customer_id', $customer->id)->where('status', 'active')->count(),
                'total_claims'       => Claim::where('customer_id', $customer->id)->count(),
                'pending_claims'     => Claim::where('customer_id', $customer->id)->where('status', 'pending')->count(),
                'total_reimbursed' => Reimbursement::whereHas('claim', fn ($q) => $q->where('customer_id', $customer->id))
                    ->where('status_paiement', 'paid')
                    ->sum('prix'),
            ],
            'claims_by_status' => Claim::where('customer_id', $customer->id)
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'active_contracts' => Contract::with('policy')
                ->where('customer_id', $customer->id)
                ->where('status', 'active')
                ->get(),
            'recent_claims' => Claim::with('reimbursement')
                ->where('customer_id', $customer->id)
                ->latest()
                ->take(5)
                ->get(),
        ];
    }
}