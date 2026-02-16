<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Events\PaymentSent;
use App\Models\Transaction;
use App\Services\LedgerService;
use Illuminate\Support\Facades\Log;

class CreateLedgerEntryOnPayment
{
    protected LedgerService $ledgerService;

    public function __construct(LedgerService $ledgerService)
    {
        $this->ledgerService = $ledgerService;
    }

    /**
     * Handle PaymentReceived event (inbound = credit entry).
     */
    public function handlePaymentReceived(PaymentReceived $event): void
    {
        $payment = $event->payment;

        // Idempotency check
        $existing = Transaction::withoutGlobalScopes()
            ->where('payment_id', $payment->id)
            ->exists();

        if ($existing) {
            return;
        }

        try {
            $gatewayName = ucfirst($payment->gateway);
            $ref = $payment->gateway_txn_ref ?? $payment->pp_TxnRefNo;

            $this->ledgerService->createTransaction([
                'tenant_id' => $payment->tenant_id,
                'party_id' => $payment->party_id,
                'user_id' => $payment->initiated_by,
                'type' => 'credit',
                'amount' => $payment->amount,
                'date' => now()->format('Y-m-d'),
                'description' => "Payment received via {$gatewayName} — Ref: {$ref}",
                'reference_number' => $ref,
                'payment_id' => $payment->id,
            ]);
        } catch (\Throwable $e) {
            Log::channel('payment')->error('Failed to create ledger entry for payment', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle PaymentSent event (outbound = debit entry).
     */
    public function handlePaymentSent(PaymentSent $event): void
    {
        $payment = $event->payment;

        $existing = Transaction::withoutGlobalScopes()
            ->where('payment_id', $payment->id)
            ->exists();

        if ($existing) {
            return;
        }

        try {
            $gatewayName = ucfirst($payment->gateway);
            $ref = $payment->gateway_txn_ref ?? $payment->pp_TxnRefNo;

            $this->ledgerService->createTransaction([
                'tenant_id' => $payment->tenant_id,
                'party_id' => $payment->party_id,
                'user_id' => $payment->initiated_by,
                'type' => 'debit',
                'amount' => $payment->amount,
                'date' => now()->format('Y-m-d'),
                'description' => "Payment sent via {$gatewayName} — Ref: {$ref}",
                'reference_number' => $ref,
                'payment_id' => $payment->id,
            ]);
        } catch (\Throwable $e) {
            Log::channel('payment')->error('Failed to create ledger entry for payment', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
