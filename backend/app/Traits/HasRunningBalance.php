<?php

namespace App\Traits;

use App\Models\Transaction;

trait HasRunningBalance
{
    /**
     * Recalculate all running balances for a party from a given date onwards.
     */
    public static function recalculateBalances(int $partyId, ?string $fromDate = null): void
    {
        $party = \App\Models\Party::findOrFail($partyId);

        $query = Transaction::withoutGlobalScopes()
            ->where('party_id', $partyId)
            ->whereNull('deleted_at')
            ->orderBy('date')
            ->orderBy('id');

        if ($fromDate) {
            // Get the last balance before the fromDate
            $previousTransaction = Transaction::withoutGlobalScopes()
                ->where('party_id', $partyId)
                ->whereNull('deleted_at')
                ->where('date', '<', $fromDate)
                ->orderByDesc('date')
                ->orderByDesc('id')
                ->first();

            $runningBalance = $previousTransaction
                ? $previousTransaction->running_balance
                : ($party->opening_balance_type === 'dr'
                    ? $party->opening_balance
                    : -$party->opening_balance);

            $query->where(function ($q) use ($fromDate) {
                $q->where('date', '>=', $fromDate);
            });
        } else {
            $runningBalance = $party->opening_balance_type === 'dr'
                ? $party->opening_balance
                : -$party->opening_balance;
        }

        $transactions = $query->get();

        foreach ($transactions as $transaction) {
            if ($transaction->type === 'debit') {
                $runningBalance += $transaction->amount;
            } else {
                $runningBalance -= $transaction->amount;
            }

            if ($transaction->running_balance != $runningBalance) {
                Transaction::withoutGlobalScopes()
                    ->where('id', $transaction->id)
                    ->update(['running_balance' => $runningBalance]);
            }
        }
    }

    /**
     * Calculate the running balance for a new transaction.
     */
    public static function calculateNewBalance(int $partyId, string $type, float $amount, string $date): float
    {
        $party = \App\Models\Party::findOrFail($partyId);

        // Get the last transaction on or before this date
        $lastTransaction = Transaction::withoutGlobalScopes()
            ->where('party_id', $partyId)
            ->whereNull('deleted_at')
            ->where(function ($q) use ($date) {
                $q->where('date', '<', $date)
                    ->orWhere('date', '=', $date);
            })
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->first();

        $previousBalance = $lastTransaction
            ? $lastTransaction->running_balance
            : ($party->opening_balance_type === 'dr'
                ? $party->opening_balance
                : -$party->opening_balance);

        return $type === 'debit'
            ? $previousBalance + $amount
            : $previousBalance - $amount;
    }
}
