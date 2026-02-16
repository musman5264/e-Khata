<?php

namespace App\Listeners;

use App\Events\TransactionCreated;
use App\Services\NotificationService;
use App\Models\Tenant;

class SendTransactionNotification
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(TransactionCreated $event): void
    {
        $transaction = $event->transaction;
        $party = $transaction->party;
        $type = ucfirst($transaction->type);
        $amount = number_format($transaction->amount, 2);

        // Notify tenant owner and managers
        $tenant = Tenant::find($transaction->tenant_id);
        if (!$tenant) return;

        $ownerIds = $tenant->users()
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['Owner', 'Manager']))
            ->pluck('users.id')
            ->toArray();

        // Don't notify the creator
        $ownerIds = array_diff($ownerIds, [$transaction->user_id]);

        if (!empty($ownerIds)) {
            $this->notificationService->notifyMany(
                $ownerIds,
                'TransactionCreated',
                "New {$type} of Rs. {$amount}",
                "New {$type} of Rs. {$amount} added to {$party->name}",
                [
                    'action_url' => "/party/{$party->id}",
                    'transaction_id' => $transaction->id,
                    'party_id' => $party->id,
                ],
                $transaction->tenant_id,
            );
        }
    }
}
