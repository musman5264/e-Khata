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
     * Proper accounting ledger:
     *   Opening Balance → each transaction with debit / credit / running balance → Closing Balance
     */
    public function partyLedger(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('view_reports');

        $party = Party::findOrFail($partyId);
        $query = Transaction::where('party_id', $partyId);

        $dateFrom = $request->date_from;
        $dateTo = $request->date_to;

        if ($dateFrom && $dateTo) {
            $query->whereBetween('date', [$dateFrom, $dateTo]);
        }

        $transactions = $query->orderBy('date')->orderBy('id')->get();

        // Calculate opening balance — sum of all transactions before date_from
        $openingBalance = (float)$party->opening_balance;
        if ($party->opening_balance_type === 'credit') {
            $openingBalance = -$openingBalance;
        }

        if ($dateFrom) {
            $priorTransactions = Transaction::where('party_id', $partyId)
                ->where('date', '<', $dateFrom)
                ->get();

            foreach ($priorTransactions as $txn) {
                $openingBalance += ($txn->type === 'debit') ? (float)$txn->amount : -(float)$txn->amount;
            }
        }

        // Build ledger entries with debit/credit columns and running balance
        $runningBalance = $openingBalance;
        $totalDebit = 0;
        $totalCredit = 0;
        $ledger = [];

        // Opening balance row
        $ledger[] = [
            'id' => null,
            'date' => $dateFrom ?: ($transactions->first()?->date?->format('Y-m-d') ?: now()->format('Y-m-d')),
            'description' => 'Opening Balance',
            'reference_number' => null,
            'debit' => $openingBalance > 0 ? $openingBalance : 0,
            'credit' => $openingBalance < 0 ? abs($openingBalance) : 0,
            'running_balance' => $openingBalance,
            'balance_type' => $openingBalance >= 0 ? 'Dr' : 'Cr',
            'is_opening' => true,
            'is_closing' => false,
        ];

        foreach ($transactions as $txn) {
            $debit = $txn->type === 'debit' ? (float)$txn->amount : 0;
            $credit = $txn->type === 'credit' ? (float)$txn->amount : 0;
            $totalDebit += $debit;
            $totalCredit += $credit;
            $runningBalance += $debit - $credit;

            $ledger[] = [
                'id' => $txn->id,
                'date' => $txn->date->format('Y-m-d'),
                'description' => $txn->description,
                'reference_number' => $txn->reference_number,
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => $runningBalance,
                'balance_type' => $runningBalance >= 0 ? 'Dr' : 'Cr',
                'is_opening' => false,
                'is_closing' => false,
            ];
        }

        // Closing balance row
        $closingBalance = $runningBalance;
        $ledger[] = [
            'id' => null,
            'date' => $dateTo ?: ($transactions->last()?->date?->format('Y-m-d') ?: now()->format('Y-m-d')),
            'description' => 'Closing Balance',
            'reference_number' => null,
            'debit' => $closingBalance > 0 ? $closingBalance : 0,
            'credit' => $closingBalance < 0 ? abs($closingBalance) : 0,
            'running_balance' => $closingBalance,
            'balance_type' => $closingBalance >= 0 ? 'Dr' : 'Cr',
            'is_opening' => false,
            'is_closing' => true,
        ];

        $tenant = app('currentTenant');

        return response()->json([
            'success' => true,
            'data' => [
                'business' => [
                    'name' => $tenant->name,
                    'address' => $tenant->getSetting('address', ''),
                    'city' => $tenant->getSetting('city', ''),
                    'phone' => $tenant->getSetting('phone', ''),
                    'email' => $tenant->getSetting('email', ''),
                    'logo_url' => $tenant->logo_url,
                ],
                'party' => [
                    'id' => $party->id,
                    'name' => $party->name,
                    'mobile' => $party->mobile,
                    'email' => $party->email,
                    'address' => $party->address,
                    'city' => $party->city,
                    'type' => $party->type,
                    'khata_number' => $party->khata_number,
                    'book_number' => $party->book_number,
                    'opening_balance' => (float)$party->opening_balance,
                    'opening_balance_type' => $party->opening_balance_type,
                ],
                'ledger' => $ledger,
                'totals' => [
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                    'opening_balance' => $openingBalance,
                    'closing_balance' => $closingBalance,
                    'balance_type' => $closingBalance >= 0 ? 'Dr' : 'Cr',
                    'transaction_count' => $transactions->count(),
                ],
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
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

    /**
     * GET /api/v1/reports/party-statement/{partyId}
     * Formal party statement — suitable for sharing / printing.
     * Includes: business info, party info, date range, full ledger, summary.
     */
    public function partyStatement(Request $request, int $partyId): JsonResponse
    {
        $this->authorize('view_reports');

        $party = Party::findOrFail($partyId);
        $tenant = app('currentTenant');

        $dateFrom = $request->date_from ?: $party->created_at->format('Y-m-d');
        $dateTo = $request->date_to ?: now()->format('Y-m-d');

        $allTransactions = Transaction::where('party_id', $partyId)
            ->orderBy('date')->orderBy('id')
            ->get();

        // Opening balance (party's own opening + sum of all txns before date_from)
        $openingBalance = (float)$party->opening_balance;
        if ($party->opening_balance_type === 'credit') {
            $openingBalance = -$openingBalance;
        }

        $priorTxns = $allTransactions->filter(fn($t) => $t->date->format('Y-m-d') < $dateFrom);
        foreach ($priorTxns as $txn) {
            $openingBalance += ($txn->type === 'debit') ? (float)$txn->amount : -(float)$txn->amount;
        }

        $periodTxns = $allTransactions->filter(fn($t) =>
            $t->date->format('Y-m-d') >= $dateFrom && $t->date->format('Y-m-d') <= $dateTo
        );

        $runningBalance = $openingBalance;
        $entries = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($periodTxns as $txn) {
            $debit = $txn->type === 'debit' ? (float)$txn->amount : 0;
            $credit = $txn->type === 'credit' ? (float)$txn->amount : 0;
            $totalDebit += $debit;
            $totalCredit += $credit;
            $runningBalance += $debit - $credit;

            $entries[] = [
                'date' => $txn->date->format('Y-m-d'),
                'description' => $txn->description ?: ($txn->type === 'debit' ? 'Amount Received' : 'Amount Given'),
                'reference' => $txn->reference_number,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $runningBalance,
                'balance_type' => $runningBalance >= 0 ? 'Dr' : 'Cr',
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'business' => [
                    'name' => $tenant->name,
                    'address' => $tenant->getSetting('address', ''),
                    'phone' => $tenant->getSetting('phone', ''),
                ],
                'party' => [
                    'id' => $party->id,
                    'name' => $party->name,
                    'mobile' => $party->mobile,
                    'address' => $party->address,
                    'city' => $party->city,
                    'khata_number' => $party->khata_number,
                    'book_number' => $party->book_number,
                ],
                'period' => ['from' => $dateFrom, 'to' => $dateTo],
                'opening_balance' => $openingBalance,
                'opening_balance_type' => $openingBalance >= 0 ? 'Dr' : 'Cr',
                'entries' => $entries,
                'closing_balance' => $runningBalance,
                'closing_balance_type' => $runningBalance >= 0 ? 'Dr' : 'Cr',
                'summary' => [
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                    'net_change' => $totalDebit - $totalCredit,
                    'transaction_count' => count($entries),
                ],
                'generated_at' => now()->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/cash-flow
     * Cash flow summary — daily/weekly/monthly aggregated debit & credit totals.
     */
    public function cashFlow(Request $request): JsonResponse
    {
        $this->authorize('view_reports');

        $period = $request->get('period', 'daily'); // daily, weekly, monthly
        $dateFrom = $request->date_from ?: now()->subDays(30)->format('Y-m-d');
        $dateTo = $request->date_to ?: now()->format('Y-m-d');

        $groupBy = match ($period) {
            'weekly' => "YEARWEEK(date, 1)",
            'monthly' => "DATE_FORMAT(date, '%Y-%m')",
            default => "DATE(date)",
        };

        $labelSelect = match ($period) {
            'weekly' => "CONCAT(DATE(DATE_SUB(date, INTERVAL WEEKDAY(date) DAY)), ' - ', DATE(DATE_ADD(DATE_SUB(date, INTERVAL WEEKDAY(date) DAY), INTERVAL 6 DAY))) as period_label",
            'monthly' => "DATE_FORMAT(date, '%Y-%m') as period_label",
            default => "DATE(date) as period_label",
        };

        $data = Transaction::whereBetween('date', [$dateFrom, $dateTo])
            ->selectRaw("
                {$labelSelect},
                {$groupBy} as period_key,
                SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debit,
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credit,
                COUNT(*) as txn_count
            ")
            ->groupBy('period_key', 'period_label')
            ->orderBy('period_key')
            ->get()
            ->map(fn($row) => [
                'period' => $row->period_label,
                'total_debit' => (float)$row->total_debit,
                'total_credit' => (float)$row->total_credit,
                'net' => (float)$row->total_debit - (float)$row->total_credit,
                'txn_count' => $row->txn_count,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'period_type' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'periods' => $data,
                'totals' => [
                    'total_debit' => $data->sum('total_debit'),
                    'total_credit' => $data->sum('total_credit'),
                    'net' => $data->sum('net'),
                    'total_transactions' => $data->sum('txn_count'),
                ],
            ],
        ]);
    }
}
