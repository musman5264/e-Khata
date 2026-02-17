<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * GET /api/v1/reports/dashboard
     * Dashboard summary: totals, recent, daily chart data.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorize('view_reports');

        $tenantId = app('currentTenant')->id;

        // Aggregate party balances
        $partyStats = Party::where('is_active', true)
            ->selectRaw("
                COUNT(*) as party_count,
                SUM(CASE WHEN (
                    SELECT COALESCE(running_balance, 0)
                    FROM transactions
                    WHERE transactions.party_id = parties.id
                      AND transactions.tenant_id = parties.tenant_id
                      AND transactions.deleted_at IS NULL
                    ORDER BY transactions.date DESC, transactions.id DESC
                    LIMIT 1
                ) > 0 THEN (
                    SELECT running_balance
                    FROM transactions
                    WHERE transactions.party_id = parties.id
                      AND transactions.tenant_id = parties.tenant_id
                      AND transactions.deleted_at IS NULL
                    ORDER BY transactions.date DESC, transactions.id DESC
                    LIMIT 1
                ) ELSE 0 END) as total_receivable,
                SUM(CASE WHEN (
                    SELECT COALESCE(running_balance, 0)
                    FROM transactions
                    WHERE transactions.party_id = parties.id
                      AND transactions.tenant_id = parties.tenant_id
                      AND transactions.deleted_at IS NULL
                    ORDER BY transactions.date DESC, transactions.id DESC
                    LIMIT 1
                ) < 0 THEN ABS((
                    SELECT running_balance
                    FROM transactions
                    WHERE transactions.party_id = parties.id
                      AND transactions.tenant_id = parties.tenant_id
                      AND transactions.deleted_at IS NULL
                    ORDER BY transactions.date DESC, transactions.id DESC
                    LIMIT 1
                )) ELSE 0 END) as total_payable
            ")
            ->first();

        // Simpler fallback approach using Party model computed attributes
        $parties = Party::where('is_active', true)->get();
        $totalReceivable = 0;
        $totalPayable = 0;
        foreach ($parties as $party) {
            $balance = $party->current_balance;
            if ($balance > 0) {
                $totalReceivable += $balance;
            } elseif ($balance < 0) {
                $totalPayable += abs($balance);
            }
        }

        // Recent transactions
        $recentTransactions = Transaction::with('party:id,name', 'user:id,name')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($txn) => [
                'id' => $txn->id,
                'party_name' => $txn->party?->name,
                'type' => $txn->type,
                'amount' => (float)$txn->amount,
                'description' => $txn->description,
                'date' => $txn->date->format('Y-m-d'),
                'user_name' => $txn->user?->name,
                'created_at' => $txn->created_at,
            ]);

        // Daily totals for last 30 days
        $dailyTotals = Transaction::where('date', '>=', now()->subDays(30))
            ->selectRaw("
                DATE(date) as transaction_date,
                SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debit,
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credit
            ")
            ->groupBy('transaction_date')
            ->orderBy('transaction_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_receivable' => $totalReceivable,
                'total_payable' => $totalPayable,
                'net_balance' => $totalReceivable - $totalPayable,
                'party_count' => $parties->count(),
                'recent_transactions' => $recentTransactions,
                'daily_totals' => $dailyTotals,
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/daybook?date=YYYY-MM-DD&date_from=&date_to=
     * All transactions across parties for a date or date range.
     */
    public function daybook(Request $request): JsonResponse
    {
        $this->authorize('view_reports');

        $query = Transaction::with('party:id,name,mobile', 'user:id,name');

        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        } elseif ($request->has('date_from') && $request->has('date_to')) {
            $query->whereBetween('date', [$request->date_from, $request->date_to]);
        } else {
            $query->whereDate('date', today());
        }

        $transactions = $query->orderBy('date')->orderBy('id')->get();

        $totals = [
            'total_debit' => $transactions->where('type', 'debit')->sum('amount'),
            'total_credit' => $transactions->where('type', 'credit')->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions->map(fn($txn) => [
                    'id' => $txn->id,
                    'date' => $txn->date->format('Y-m-d'),
                    'party_name' => $txn->party?->name,
                    'party_mobile' => $txn->party?->mobile,
                    'type' => $txn->type,
                    'amount' => (float)$txn->amount,
                    'description' => $txn->description,
                    'reference_number' => $txn->reference_number,
                    'user_name' => $txn->user?->name,
                ]),
                'totals' => $totals,
                'net' => $totals['total_debit'] - $totals['total_credit'],
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/trial-balance
     * All parties with current balance.
     */
    public function trialBalance(Request $request): JsonResponse
    {
        $this->authorize('view_reports');

        $parties = Party::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($party) {
                $balance = $party->current_balance;
                return [
                    'id' => $party->id,
                    'name' => $party->name,
                    'mobile' => $party->mobile,
                    'type' => $party->type,
                    'khata_number' => $party->khata_number,
                    'book_number' => $party->book_number,
                    'debit_balance' => $balance > 0 ? (float)$balance : 0,
                    'credit_balance' => $balance < 0 ? abs((float)$balance) : 0,
                    'net_balance' => (float)$balance,
                    'balance_type' => $balance > 0 ? 'Dr' : ($balance < 0 ? 'Cr' : '-'),
                ];
            });

        $totals = [
            'total_debit_balance' => $parties->sum('debit_balance'),
            'total_credit_balance' => $parties->sum('credit_balance'),
            'net_balance' => $parties->sum('net_balance'),
            'party_count' => $parties->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'parties' => $parties,
                'totals' => $totals,
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/party-ledger/{partyId}
     * Full transaction history for a party.
     */
    public function partyLedger(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('view_reports');

        $party = Party::findOrFail($partyId);
        $query = Transaction::where('party_id', $partyId);

        if ($request->has('date_from') && $request->has('date_to')) {
            $query->whereBetween('date', [$request->date_from, $request->date_to]);
        }

        $transactions = $query->orderBy('date')->orderBy('id')->get()
            ->map(fn($txn) => [
                'id' => $txn->id,
                'date' => $txn->date->format('Y-m-d'),
                'type' => $txn->type,
                'amount' => (float)$txn->amount,
                'description' => $txn->description,
                'reference_number' => $txn->reference_number,
                'running_balance' => (float)$txn->running_balance,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'party' => [
                    'id' => $party->id,
                    'name' => $party->name,
                    'mobile' => $party->mobile,
                    'type' => $party->type,
                    'opening_balance' => (float)$party->opening_balance,
                    'opening_balance_type' => $party->opening_balance_type,
                ],
                'transactions' => $transactions,
                'totals' => [
                    'total_debit' => $transactions->where('type', 'debit')->sum('amount'),
                    'total_credit' => $transactions->where('type', 'credit')->sum('amount'),
                    'balance' => $party->current_balance,
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/payment-summary
     */
    public function paymentSummary(Request $request): JsonResponse
    {
        $this->authorize('view_reports');

        $query = \App\Models\Payment::query();

        if ($request->has('date_from') && $request->has('date_to')) {
            $query->whereBetween('created_at', [$request->date_from, $request->date_to]);
        }

        $payments = $query->orderByDesc('created_at')->get();

        $summary = [
            'total_collected' => $payments->where('type', 'collect')->where('status', 'completed')->sum('amount'),
            'total_sent' => $payments->where('type', 'send')->where('status', 'completed')->sum('amount'),
            'total_pending' => $payments->where('status', 'pending')->sum('amount'),
            'total_failed' => $payments->where('status', 'failed')->sum('amount'),
            'count' => $payments->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'payments' => $payments->take(50)->map(fn($p) => [
                    'id' => $p->id,
                    'type' => $p->type,
                    'amount' => (float)$p->amount,
                    'status' => $p->status,
                    'gateway' => $p->gateway,
                    'created_at' => $p->created_at->format('Y-m-d H:i'),
                ]),
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/receivable-aging
     * Parties who owe money (debit balance > 0).
     */
    public function receivableAging(): JsonResponse
    {
        $this->authorize('view_reports');

        $parties = Party::where('is_active', true)->orderBy('name')->get()
            ->filter(fn($p) => $p->current_balance > 0)
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'mobile' => $p->mobile,
                'balance' => (float)$p->current_balance,
                'last_txn_date' => $p->transactions()->orderByDesc('date')->value('date'),
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'parties' => $parties,
                'total' => $parties->sum('balance'),
                'count' => $parties->count(),
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/payable-aging
     * Parties we owe money to (credit balance < 0).
     */
    public function payableAging(): JsonResponse
    {
        $this->authorize('view_reports');

        $parties = Party::where('is_active', true)->orderBy('name')->get()
            ->filter(fn($p) => $p->current_balance < 0)
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'mobile' => $p->mobile,
                'balance' => abs((float)$p->current_balance),
                'last_txn_date' => $p->transactions()->orderByDesc('date')->value('date'),
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'parties' => $parties,
                'total' => $parties->sum('balance'),
                'count' => $parties->count(),
            ],
        ]);
    }
}
