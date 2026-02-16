<?php

namespace App\Observers;

use App\Events\TransactionCreated;
use App\Events\TransactionDeleted;
use App\Events\TransactionEdited;
use App\Models\Transaction;
use App\Traits\HasRunningBalance;

class TransactionObserver
{
    /**
     * After a transaction is created, fire event.
     */
    public function created(Transaction $transaction): void
    {
        event(new TransactionCreated($transaction));
    }

    /**
     * After a transaction is updated, fire event.
     */
    public function updated(Transaction $transaction): void
    {
        event(new TransactionEdited($transaction));
    }

    /**
     * After a transaction is deleted (soft), fire event.
     */
    public function deleted(Transaction $transaction): void
    {
        event(new TransactionDeleted($transaction));
    }
}
