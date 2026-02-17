<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionAdminController extends Controller
{
    /* ═══════════════════════════════════════════════════════════
     * PLAN MANAGEMENT
     * ═══════════════════════════════════════════════════════════ */

    /**
     * GET /api/v1/admin/subscription/plans
     * List all plans (including inactive).
     */
    public function plans(): JsonResponse
    {
        $plans = SubscriptionPlan::orderBy('sort_order')
            ->orderBy('price')
            ->withCount('subscriptions')
            ->get();

        return response()->json(['success' => true, 'data' => $plans]);
    }

    /**
     * POST /api/v1/admin/subscription/plans
     * Create a new plan.
     */
    public function createPlan(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly',
            'max_parties' => 'nullable|integer|min:0',
            'max_users' => 'nullable|integer|min:0',
            'max_transactions' => 'nullable|integer|min:0',
            'has_reports' => 'nullable|boolean',
            'has_payment_links' => 'nullable|boolean',
            'has_sms' => 'nullable|boolean',
            'has_whatsapp' => 'nullable|boolean',
            'trial_days' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
        ]);

        $plan = SubscriptionPlan::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'price' => $request->price,
            'billing_cycle' => $request->billing_cycle,
            'duration_days' => $request->billing_cycle === 'monthly' ? 30 : 365,
            'max_parties' => $request->max_parties ?? 0,
            'max_users' => $request->max_users ?? 0,
            'max_transactions' => $request->max_transactions ?? 0,
            'has_reports' => $request->has_reports ?? true,
            'has_payment_links' => $request->has_payment_links ?? true,
            'has_sms' => $request->has_sms ?? false,
            'has_whatsapp' => $request->has_whatsapp ?? false,
            'features' => $request->features,
            'trial_days' => $request->trial_days ?? 0,
            'sort_order' => SubscriptionPlan::max('sort_order') + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Plan created successfully',
            'data' => $plan,
        ], 201);
    }

    /**
     * PUT /api/v1/admin/subscription/plans/{id}
     * Update a plan.
     */
    public function updatePlan(Request $request, int $id): JsonResponse
    {
        $plan = SubscriptionPlan::findOrFail($id);

        $request->validate([
            'name' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'price' => 'nullable|numeric|min:0',
            'billing_cycle' => 'nullable|in:monthly,yearly',
            'max_parties' => 'nullable|integer|min:0',
            'max_users' => 'nullable|integer|min:0',
            'max_transactions' => 'nullable|integer|min:0',
            'has_reports' => 'nullable|boolean',
            'has_payment_links' => 'nullable|boolean',
            'has_sms' => 'nullable|boolean',
            'has_whatsapp' => 'nullable|boolean',
            'trial_days' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'features' => 'nullable|array',
        ]);

        $data = $request->only([
            'name', 'description', 'price', 'billing_cycle',
            'max_parties', 'max_users', 'max_transactions',
            'has_reports', 'has_payment_links', 'has_sms', 'has_whatsapp',
            'trial_days', 'is_active', 'features',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        if (isset($data['billing_cycle'])) {
            $data['duration_days'] = $data['billing_cycle'] === 'monthly' ? 30 : 365;
        }

        $plan->update(array_filter($data, fn($v) => $v !== null));

        return response()->json([
            'success' => true,
            'message' => 'Plan updated',
            'data' => $plan->fresh(),
        ]);
    }

    /**
     * DELETE /api/v1/admin/subscription/plans/{id}
     * Deactivate a plan (soft delete — never truly delete).
     */
    public function deletePlan(int $id): JsonResponse
    {
        $plan = SubscriptionPlan::findOrFail($id);

        // Check for active subscriptions on this plan
        $activeCount = Subscription::where('plan_id', $plan->id)
            ->whereIn('status', ['active', 'trial'])
            ->count();

        if ($activeCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete: {$activeCount} active subscription(s) on this plan. Deactivate instead.",
            ], 400);
        }

        $plan->update(['is_active' => false]);

        return response()->json(['success' => true, 'message' => 'Plan deactivated']);
    }

    /* ═══════════════════════════════════════════════════════════
     * SUBSCRIPTION MANAGEMENT
     * ═══════════════════════════════════════════════════════════ */

    /**
     * GET /api/v1/admin/subscription/list
     * List all subscriptions across all tenants.
     */
    public function list(Request $request): JsonResponse
    {
        $query = Subscription::with(['tenant:id,name,phone', 'plan:id,name,billing_cycle,price']);

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->tenant_id) {
            $query->where('tenant_id', $request->tenant_id);
        }
        if ($request->plan_id) {
            $query->where('plan_id', $request->plan_id);
        }

        $subscriptions = $query->orderByDesc('created_at')->paginate(20);

        return response()->json(['success' => true, 'data' => $subscriptions]);
    }

    /**
     * POST /api/v1/admin/subscription/assign
     * Manually assign a subscription to a tenant (Super Admin).
     */
    public function assign(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'plan_id' => 'required|exists:subscription_plans,id',
            'duration_days' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);
        $plan = SubscriptionPlan::findOrFail($request->plan_id);

        // Check existing subscription
        $existing = $tenant->activeSubscription();
        if ($existing) {
            // Expire/cancel old subscription
            $existing->update(['status' => 'cancelled', 'cancelled_at' => now(), 'cancellation_reason' => 'Replaced by admin']);
        }

        $durationDays = $request->duration_days ?? $plan->duration_days;
        $now = now();

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => $now,
            'ends_at' => $now->copy()->addDays($durationDays),
            'auto_renew' => false,
        ]);

        // Create a manual payment record
        SubscriptionPayment::create([
            'subscription_id' => $subscription->id,
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'user_id' => $request->user()->id,
            'amount' => $plan->price,
            'gateway' => 'manual',
            'status' => 'completed',
            'paid_at' => $now,
            'notes' => $request->notes ?? 'Manually assigned by Super Admin',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Subscription assigned to {$tenant->name} for {$durationDays} days",
            'data' => $subscription->load('plan'),
        ], 201);
    }

    /**
     * PUT /api/v1/admin/subscription/{id}/extend
     * Extend a subscription's end date.
     */
    public function extend(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $subscription = Subscription::findOrFail($id);
        $subscription->update([
            'ends_at' => $subscription->ends_at->addDays($request->days),
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Subscription extended by {$request->days} days",
            'data' => $subscription->fresh()->load('plan'),
        ]);
    }

    /**
     * PUT /api/v1/admin/subscription/{id}/suspend
     * Suspend a subscription.
     */
    public function suspend(int $id): JsonResponse
    {
        $subscription = Subscription::findOrFail($id);
        $subscription->update(['status' => 'suspended']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription suspended',
        ]);
    }

    /* ═══════════════════════════════════════════════════════════
     * PAYMENT REPORTS
     * ═══════════════════════════════════════════════════════════ */

    /**
     * GET /api/v1/admin/subscription/payments
     * List all subscription payments.
     */
    public function payments(Request $request): JsonResponse
    {
        $query = SubscriptionPayment::with([
            'tenant:id,name',
            'plan:id,name,billing_cycle',
            'user:id,name',
        ]);

        if ($request->status) $query->where('status', $request->status);
        if ($request->gateway) $query->where('gateway', $request->gateway);
        if ($request->tenant_id) $query->where('tenant_id', $request->tenant_id);
        if ($request->date_from) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->date_to) $query->whereDate('created_at', '<=', $request->date_to);

        $payments = $query->orderByDesc('created_at')->paginate(20);

        // Revenue summary
        $totalRevenue = SubscriptionPayment::where('status', 'completed')->sum('amount');
        $monthlyRevenue = SubscriptionPayment::where('status', 'completed')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => $payments,
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'monthly_revenue' => (float) $monthlyRevenue,
                'pending_payments' => SubscriptionPayment::where('status', 'pending')->count(),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/subscription/stats
     * Overall subscription statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_plans' => SubscriptionPlan::count(),
                'active_plans' => SubscriptionPlan::where('is_active', true)->count(),
                'total_subscriptions' => Subscription::count(),
                'active_subscriptions' => Subscription::whereIn('status', ['active', 'trial'])->where('ends_at', '>', now())->count(),
                'trial_subscriptions' => Subscription::where('status', 'trial')->where('ends_at', '>', now())->count(),
                'expired_subscriptions' => Subscription::where('status', 'expired')->orWhere('ends_at', '<=', now())->count(),
                'total_revenue' => (float) SubscriptionPayment::where('status', 'completed')->sum('amount'),
                'monthly_revenue' => (float) SubscriptionPayment::where('status', 'completed')
                    ->whereMonth('paid_at', now()->month)
                    ->whereYear('paid_at', now()->year)
                    ->sum('amount'),
                'tenants_without_subscription' => Tenant::whereDoesntHave('subscriptions', function ($q) {
                    $q->whereIn('status', ['active', 'trial'])->where('ends_at', '>', now());
                })->count(),
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/subscription/payments/{id}/mark-paid
     * Manually mark a payment as completed (Super Admin).
     */
    public function markPaid(Request $request, int $id): JsonResponse
    {
        $payment = SubscriptionPayment::findOrFail($id);

        if ($payment->status === 'completed') {
            return response()->json(['success' => false, 'message' => 'Already paid'], 400);
        }

        $payment->update([
            'status' => 'completed',
            'paid_at' => now(),
            'notes' => ($payment->notes ? $payment->notes . "\n" : '') . 'Manually marked as paid by admin',
        ]);

        // Activate subscription if not already
        $subscription = $payment->subscription;
        if ($subscription && !in_array($subscription->status, ['active'])) {
            $subscription->update(['status' => 'active']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment marked as completed and subscription activated',
        ]);
    }
}
