<?php

namespace App\Services;

use App\Models\Party;
use App\Models\Transaction;
use App\Traits\HasRunningBalance;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    /**
     * Create a transaction and compute running balance.
     */
    public function createTransaction(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            $balance = Transaction::calculateNewBalance(
                $data['party_id'],
                $data['type'],
                $data['amount'],
                $data['date']
            );

            $transaction = Transaction::create(array_merge($data, [
                'running_balance' => $balance,
            ]));

            // Recalculate downstream if this isn't the latest
            $this->recalculateIfNeeded($transaction);

            return $transaction;
        });
    }

    /**
     * Update a transaction and recalculate downstream balances.
     */
    public function updateTransaction(Transaction $transaction, array $data): Transaction
    {
        return DB::transaction(function () use ($transaction, $data) {
            $originalDate = $transaction->date->format('Y-m-d');

            $transaction->update($data);

            // Recalculate from the earliest affected date
            $newDate = $data['date'] ?? $originalDate;
            $earliestDate = min($originalDate, $newDate);

            Transaction::recalculateBalances($transaction->party_id, $earliestDate);

            return $transaction->fresh();
        });
    }

    /**
     * Delete a transaction and recalculate downstream.
     */
    public function deleteTransaction(Transaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $partyId = $transaction->party_id;
            $date = $transaction->date->format('Y-m-d');

            $transaction->delete();

            Transaction::recalculateBalances($partyId, $date);
        });
    }

    /**
     * Get ledger statement for a party.
     */
    public function getStatement(
        int $partyId,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $type = null,
    ): array {
        $party = Party::findOrFail($partyId);

        $query = Transaction::where('party_id', $partyId)
            ->orderBy('date')
            ->orderBy('id');

        if ($dateFrom) {
            $query->where('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('date', '<=', $dateTo);
        }
        if ($type) {
            $query->where('type', $type);
        }

        $transactions = $query->get();

        $totalDebit = $transactions->where('type', 'debit')->sum('amount');
        $totalCredit = $transactions->where('type', 'credit')->sum('amount');

        return [
            'party' => $party,
            'transactions' => $transactions,
            'opening_balance' => $party->opening_balance,
            'opening_balance_type' => $party->opening_balance_type,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'closing_balance' => $transactions->last()?->running_balance ?? $party->current_balance,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];
    }

    /**
     * Recalculate downstream balances if the new transaction isn't the latest.
     */
    protected function recalculateIfNeeded(Transaction $transaction): void
    {
        $hasLater = Transaction::where('party_id', $transaction->party_id)
            ->where('id', '!=', $transaction->id)
            ->where(function ($q) use ($transaction) {
                $q->where('date', '>', $transaction->date)
                    ->orWhere(function ($q2) use ($transaction) {
                        $q2->where('date', $transaction->date)
                            ->where('id', '>', $transaction->id);
                    });
            })
            ->exists();

        if ($hasLater) {
            Transaction::recalculateBalances($transaction->party_id, $transaction->date->format('Y-m-d'));
        }
    }
}
