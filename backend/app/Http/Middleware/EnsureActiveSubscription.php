<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to enforce active subscription for tenant-scoped operations.
 * Applied to routes that require a paid subscription (e.g., creating parties, transactions).
 * Allows read-only operations even without a subscription (reports, viewing data).
 */
class EnsureActiveSubscription
{
    /**
     * Routes that are always allowed, even without an active subscription.
     * These let users view their data and manage their subscription.
     */
    private array $alwaysAllowed = [
        'subscription/*',       // Subscription management
        'auth/*',               // Auth operations
        'tenants',              // List/create tenants
        'tenants/current',      // View current tenant
        'sessions/*',           // Session management
        'notifications/*',     // Notifications
    ];

    /**
     * HTTP methods that are read-only (always allowed during grace period).
     */
    private array $readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $request->attributes->get('tenant');

        // No tenant context — skip (other middleware handles this)
        if (!$tenant) {
            return $next($request);
        }

        // Super admins bypass subscription checks
        $user = $request->user();
        if ($user && $user->hasRole('Super Admin')) {
            return $next($request);
        }

        // Check if route is always allowed
        $path = $request->path();
        foreach ($this->alwaysAllowed as $pattern) {
            if (fnmatch("api/v1/{$pattern}", $path) || fnmatch("v1/{$pattern}", $path)) {
                return $next($request);
            }
        }

        // Check subscription
        $subscription = $tenant->activeSubscription();

        if (!$subscription) {
            // No active subscription — block write operations
            if (!in_array($request->method(), $this->readOnlyMethods)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your subscription has expired. Please renew to continue.',
                    'error' => 'subscription_required',
                    'redirect' => '/subscription',
                ], 403);
            }
        }

        // Attach subscription info to the request for downstream use
        if ($subscription) {
            $request->attributes->set('subscription', $subscription);
        }

        return $next($request);
    }
}
