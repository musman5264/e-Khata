<?php

namespace App\Services;

use App\Models\LedgerShare;
use App\Models\Party;
use App\Models\Tenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

class PdfService
{
    /**
     * Generate a bank-statement-style PDF for a party.
     */
    public function generateStatement(
        Party $party,
        ?string $dateFrom = null,
        ?string $dateTo = null,
    ): \Barryvdh\DomPDF\PDF {
        $ledgerService = app(LedgerService::class);
        $statement = $ledgerService->getStatement($party->id, $dateFrom, $dateTo);
        $tenant = app('currentTenant') ?? $party->tenant;

        $data = [
            'tenant' => $tenant,
            'party' => $party,
            'transactions' => $statement['transactions'],
            'opening_balance' => $statement['opening_balance'],
            'opening_balance_type' => $statement['opening_balance_type'],
            'total_debit' => $statement['total_debit'],
            'total_credit' => $statement['total_credit'],
            'closing_balance' => $statement['closing_balance'],
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];

        return Pdf::loadView('pdf.statement', $data)
            ->setPaper('a4', 'portrait');
    }
}
