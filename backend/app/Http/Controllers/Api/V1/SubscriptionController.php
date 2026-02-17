<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Services\JazzCashService;
use App\Services\EasyPaisaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    /**
     * GET /api/v1/subscription/plans
     * List all active subscription plans (public).
     */
    public function plans(): JsonResponse
    {
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('price')
            ->get()
            ->map(fn($plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => (float) $plan->price,
                'formatted_price' => $plan->formatted_price,
                'monthly_price' => $plan->monthly_price,
                'billing_cycle' => $plan->billing_cycle,
                'duration_days' => $plan->duration_days,
                'trial_days' => $plan->trial_days,
                'max_parties' => $plan->max_parties,
                'max_users' => $plan->max_users,
                'max_transactions' => $plan->max_transactions,
                'has_reports' => $plan->has_reports,
                'has_payment_links' => $plan->has_payment_links,
                'has_sms' => $plan->has_sms,
                'has_whatsapp' => $plan->has_whatsapp,
                'features' => $plan->features,
            ]);

        return response()->json(['success' => true, 'data' => $plans]);
    }

    /**
     * GET /api/v1/subscription/current
     * Get the current subscription for the active tenant.
     */
    public function current(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'No tenant selected'], 400);
        }

        $subscription = $tenant->activeSubscription();

        if (!$subscription) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_subscription' => false,
                    'subscription' => null,
                ],
            ]);
        }

        // Check & update status if needed
        $subscription->checkAndUpdateStatus();
        $subscription->load('plan');

        return response()->json([
            'success' => true,
            'data' => [
                'has_subscription' => $subscription->isActive(),
                'subscription' => [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'plan' => [
                        'id' => $subscription->plan->id,
                        'name' => $subscription->plan->name,
                        'billing_cycle' => $subscription->plan->billing_cycle,
                        'price' => (float) $subscription->plan->price,
                        'formatted_price' => $subscription->plan->formatted_price,
                    ],
                    'starts_at' => $subscription->starts_at->toDateTimeString(),
                    'ends_at' => $subscription->ends_at->toDateTimeString(),
                    'trial_ends_at' => $subscription->trial_ends_at?->toDateTimeString(),
                    'days_remaining' => $subscription->daysRemaining(),
                    'auto_renew' => $subscription->auto_renew,
                    'is_trial' => $subscription->isTrial(),
                ],
            ],
        ]);
    }

    /**
     * POST /api/v1/subscription/subscribe
     * Subscribe a tenant to a plan.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'gateway' => 'required|in:jazzcash,easypaisa',
        ]);

        $tenant = $request->attributes->get('tenant');
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'No tenant selected'], 400);
        }

        $plan = SubscriptionPlan::findOrFail($request->plan_id);

        if (!$plan->is_active) {
            return response()->json(['success' => false, 'message' => 'This plan is no longer available'], 400);
        }

        // Check if tenant already has an active subscription
        $existingSubscription = $tenant->activeSubscription();
        if ($existingSubscription) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active subscription. Please wait for it to expire or cancel it first.',
            ], 400);
        }

        return DB::transaction(function () use ($tenant, $plan, $request) {
            $now = now();
            $startsAt = $now;
            $endsAt = $now->copy()->addDays($plan->duration_days);
            $trialEndsAt = $plan->trial_days > 0 ? $now->copy()->addDays($plan->trial_days) : null;

            // Create subscription
            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => $plan->trial_days > 0 ? 'trial' : 'active',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'trial_ends_at' => $trialEndsAt,
                'auto_renew' => true,
            ]);

            // Create pending payment
            $payment = SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'user_id' => $request->user()->id,
                'amount' => $plan->price,
                'gateway' => $request->gateway,
                'status' => 'pending',
            ]);

            // Initiate gateway payment
            $gateway = $this->resolveGateway($request->gateway, $tenant);
            $reference = 'SUB-' . $payment->id . '-' . time();
            $payment->update(['gateway_reference' => $reference]);

            try {
                $gatewayResult = $gateway->collect(
                    amount: $plan->price,
                    mobileNumber: $request->user()->mobile ?? '',
                    description: "Subscription: {$plan->name}",
                    referenceNumber: $reference,
                );

                $payment->update(['gateway_response' => $gatewayResult]);

                return response()->json([
                    'success' => true,
                    'message' => 'Subscription initiated. Complete payment to activate.',
                    'data' => [
                        'subscription_id' => $subscription->id,
                        'payment_id' => $payment->id,
                        'gateway_reference' => $reference,
                        'gateway_response' => $gatewayResult,
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Subscription payment initiation failed', [
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'error' => $e->getMessage(),
                ]);

                // Still return subscription info — payment can be retried
                return response()->json([
                    'success' => true,
                    'message' => 'Subscription created but payment initiation failed. You can retry payment.',
                    'data' => [
                        'subscription_id' => $subscription->id,
                        'payment_id' => $payment->id,
                        'payment_status' => 'pending',
                        'error' => $e->getMessage(),
                    ],
                ], 201);
            }
        });
    }

    /**
     * POST /api/v1/subscription/retry-payment/{paymentId}
     * Retry a failed/pending subscription payment.
     */
    public function retryPayment(Request $request, int $paymentId): JsonResponse
    {
        $request->validate([
            'gateway' => 'required|in:jazzcash,easypaisa',
        ]);

        $tenant = $request->attributes->get('tenant');
        $payment = SubscriptionPayment::where('tenant_id', $tenant->id)
            ->where('id', $paymentId)
            ->whereIn('status', ['pending', 'failed'])
            ->firstOrFail();

        $gateway = $this->resolveGateway($request->gateway, $tenant);
        $reference = 'SUB-' . $payment->id . '-' . time();
        $payment->update(['gateway' => $request->gateway, 'gateway_reference' => $reference]);

        try {
            $gatewayResult = $gateway->collect(
                amount: $payment->amount,
                mobileNumber: $request->user()->mobile ?? '',
                description: "Subscription payment retry",
                referenceNumber: $reference,
            );

            $payment->update(['gateway_response' => $gatewayResult]);

            return response()->json([
                'success' => true,
                'message' => 'Payment reinitiated.',
                'data' => [
                    'payment_id' => $payment->id,
                    'gateway_reference' => $reference,
                    'gateway_response' => $gatewayResult,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment retry failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/subscription/cancel
     * Cancel the current subscription.
     */
    public function cancel(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $subscription = $tenant->activeSubscription();

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'No active subscription'], 400);
        }

        $subscription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->reason ?? 'User cancelled',
            'auto_renew' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription cancelled. You can continue using the service until ' . $subscription->ends_at->format('d M Y'),
        ]);
    }

    /**
     * GET /api/v1/subscription/payments
     * List subscription payments for the active tenant.
     */
    public function payments(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');

        $payments = SubscriptionPayment::where('tenant_id', $tenant->id)
            ->with(['plan:id,name,billing_cycle,price', 'user:id,name'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * POST /api/v1/subscription/callback/jazzcash
     * Handle JazzCash callback for subscription payments.
     */
    public function jazzCashCallback(Request $request): JsonResponse
    {
        Log::info('Subscription JazzCash callback received', $request->all());

        $reference = $request->pp_BillReference ?? $request->pp_TxnRefNo ?? '';
        $status = $request->pp_ResponseCode ?? '';

        // Extract payment ID from reference: SUB-{id}-{timestamp}
        if (!preg_match('/^SUB-(\d+)-/', $reference, $matches)) {
            Log::warning('Invalid subscription callback reference', ['reference' => $reference]);
            return response()->json(['status' => 'error', 'message' => 'Invalid reference']);
        }

        $payment = SubscriptionPayment::find($matches[1]);
        if (!$payment) {
            return response()->json(['status' => 'error', 'message' => 'Payment not found']);
        }

        if ($status === '000') {
            // Payment successful
            $payment->update([
                'status' => 'completed',
                'paid_at' => now(),
                'gateway_transaction_id' => $request->pp_TxnRefNo,
                'gateway_response' => $request->all(),
            ]);

            // Activate the subscription
            $subscription = $payment->subscription;
            if ($subscription && $subscription->status !== 'active') {
                $subscription->update(['status' => 'active']);
            }

            Log::info('Subscription payment completed via JazzCash', [
                'payment_id' => $payment->id,
                'subscription_id' => $payment->subscription_id,
            ]);
        } else {
            $payment->update([
                'status' => 'failed',
                'gateway_response' => $request->all(),
            ]);

            Log::warning('Subscription JazzCash payment failed', [
                'payment_id' => $payment->id,
                'response_code' => $status,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * POST /api/v1/subscription/callback/easypaisa
     * Handle EasyPaisa callback for subscription payments.
     */
    public function easypaisaCallback(Request $request): JsonResponse
    {
        Log::info('Subscription EasyPaisa callback received', $request->all());

        $reference = $request->order_id ?? $request->transaction_id ?? '';

        if (!preg_match('/^SUB-(\d+)-/', $reference, $matches)) {
            return response()->json(['status' => 'error', 'message' => 'Invalid reference']);
        }

        $payment = SubscriptionPayment::find($matches[1]);
        if (!$payment) {
            return response()->json(['status' => 'error', 'message' => 'Payment not found']);
        }

        $status = strtolower($request->status ?? $request->transaction_status ?? '');

        if (in_array($status, ['paid', 'success', 'completed'])) {
            $payment->update([
                'status' => 'completed',
                'paid_at' => now(),
                'gateway_transaction_id' => $request->transaction_id,
                'gateway_response' => $request->all(),
            ]);

            $subscription = $payment->subscription;
            if ($subscription && $subscription->status !== 'active') {
                $subscription->update(['status' => 'active']);
            }
        } else {
            $payment->update([
                'status' => 'failed',
                'gateway_response' => $request->all(),
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Resolve the payment gateway service.
     */
    private function resolveGateway(string $gateway, Tenant $tenant): JazzCashService|EasyPaisaService
    {
        return match ($gateway) {
            'jazzcash' => new JazzCashService($tenant),
            'easypaisa' => new EasyPaisaService($tenant),
            default => throw new \InvalidArgumentException("Unsupported gateway: {$gateway}"),
        };
    }
}
