<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Events\PaymentSent;
use App\Services\NotificationService;
use App\Models\Tenant;

class SendPaymentNotification
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handlePaymentReceived(PaymentReceived $event): void
    {
        $payment = $event->payment;
        $party = $payment->party;
        $amount = number_format($payment->amount, 2);
        $gateway = ucfirst($payment->gateway);

        $tenant = Tenant::find($payment->tenant_id);
        if (!$tenant) return;

        $notifyIds = $tenant->users()
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['Owner']))
            ->pluck('users.id')
            ->toArray();

        if ($payment->initiated_by) {
            $notifyIds[] = $payment->initiated_by;
        }

        $notifyIds = array_unique($notifyIds);

        $this->notificationService->notifyMany(
            $notifyIds,
            'PaymentReceived',
            "Rs. {$amount} received",
            "Rs. {$amount} received from {$party->name} via {$gateway}",
            [
                'action_url' => "/payment/{$payment->id}",
                'payment_id' => $payment->id,
                'party_id' => $party->id,
            ],
            $payment->tenant_id,
        );
    }

    public function handlePaymentSent(PaymentSent $event): void
    {
        $payment = $event->payment;
        $party = $payment->party;
        $amount = number_format($payment->amount, 2);
        $gateway = ucfirst($payment->gateway);

        $tenant = Tenant::find($payment->tenant_id);
        if (!$tenant) return;

        $notifyIds = $tenant->users()
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['Owner']))
            ->pluck('users.id')
            ->toArray();

        if ($payment->initiated_by) {
            $notifyIds[] = $payment->initiated_by;
        }

        $notifyIds = array_unique($notifyIds);

        $this->notificationService->notifyMany(
            $notifyIds,
            'PaymentSent',
            "Rs. {$amount} sent",
            "Rs. {$amount} sent to {$party->name} via {$gateway}",
            [
                'action_url' => "/payment/{$payment->id}",
                'payment_id' => $payment->id,
                'party_id' => $party->id,
            ],
            $payment->tenant_id,
        );
    }
}
