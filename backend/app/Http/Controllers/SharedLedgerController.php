<?php

namespace App\Http\Controllers;

use App\Models\LedgerShare;
use App\Models\Transaction;
use Illuminate\Http\Request;

class SharedLedgerController extends Controller
{
    /**
     * GET /shared/{token}
     * Public shared ledger page — renders HTML statement.
     */
    public function show(string $token)
    {
        $share = LedgerShare::where('share_token', $token)
            ->where('is_active', true)
            ->with('party', 'party.tenant')
            ->firstOrFail();

        if (!$share->isValid()) {
            abort(410, 'This shared ledger link has expired.');
        }

        $party = $share->party;
        $tenant = $party->tenant;

        // Fetch transactions within the shared date range
        $query = Transaction::withoutGlobalScopes()
            ->where('tenant_id', $share->tenant_id)
            ->where('party_id', $party->id)
            ->orderBy('date')
            ->orderBy('id');

        if ($share->date_from) {
            $query->whereDate('date', '>=', $share->date_from);
        }
        if ($share->date_to) {
            $query->whereDate('date', '<=', $share->date_to);
        }

        $transactions = $query->get();

        // Calculate totals
        $totalDebit = $transactions->where('type', 'debit')->sum('amount');
        $totalCredit = $transactions->where('type', 'credit')->sum('amount');
        $closingBalance = $transactions->last()?->running_balance ?? 0;

        return view('shared.public-ledger', compact(
            'share', 'party', 'tenant', 'transactions',
            'totalDebit', 'totalCredit', 'closingBalance'
        ));
    }
}
