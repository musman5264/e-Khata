<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\AutoVersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    /**
     * GET /api/v1/admin/settings
     * List all system settings (grouped).
     */
    public function index(): JsonResponse
    {
        $this->authorize('manage_system_settings');

        return response()->json([
            'success' => true,
            'data' => SystemSetting::allGrouped(),
        ]);
    }

    /**
     * PUT /api/v1/admin/settings
     * Bulk-update system settings.
     */
    public function update(Request $request): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|exists:system_settings,key',
            'settings.*.value' => 'present',
        ]);

        // Validate mandatory settings are not cleared
        foreach ($request->settings as $item) {
            $setting = SystemSetting::where('key', $item['key'])->first();
            if ($setting && $setting->is_mandatory && ($item['value'] === null || $item['value'] === '')) {
                return response()->json([
                    'success' => false,
                    'message' => "The setting '{$setting->label}' is mandatory and cannot be empty.",
                ], 422);
            }
        }

        foreach ($request->settings as $item) {
            SystemSetting::setValue($item['key'], $item['value']);
        }

        // Auto-track version for settings change with categorized changelog
        $changedSettings = collect($request->settings);
        $groups = $changedSettings->groupBy(function ($item) {
            $key = $item['key'];
            if (str_starts_with($key, 'whatsapp_')) return 'WhatsApp Configuration';
            if (str_starts_with($key, 'payment_')) return 'Payment Settings';
            if (str_starts_with($key, 'sms_')) return 'SMS Settings';
            if (str_starts_with($key, 'email_')) return 'Email Settings';
            if (str_starts_with($key, 'app_')) return 'Application Settings';
            return 'General Settings';
        });

        $changelog = "**Updated:**\n";
        foreach ($groups as $group => $items) {
            $changelog .= "\n### {$group}\n";
            foreach ($items as $item) {
                $label = str_replace('_', ' ', ucwords(str_replace('_', ' ', $item['key'])));
                $changelog .= "- {$label}\n";
            }
        }

        AutoVersionService::trackMinor(
            'System settings updated',
            $changelog
        );

        return response()->json([
            'success' => true,
            'message' => 'System settings updated successfully.',
            'data' => SystemSetting::allGrouped(),
        ]);
    }

    /**
     * GET /api/v1/admin/settings/{key}
     * Get a single setting by key.
     */
    public function show(string $key): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $setting = SystemSetting::where('key', $key)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }

    /**
     * GET /api/v1/admin/users
     * List all users in the system (Super Admin only).
     */
    public function users(Request $request): JsonResponse
    {
        $this->authorize('manage_all_users');

        $query = \App\Models\User::with('roles', 'tenants');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * GET /api/v1/admin/users/{id}
     * Get single user details (Super Admin only).
     */
    public function showUser(int $id): JsonResponse
    {
        $this->authorize('manage_all_users');

        $user = \App\Models\User::with('roles', 'tenants')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * PUT /api/v1/admin/users/{id}
     * Update user details (Super Admin only).
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $this->authorize('manage_all_users');

        $user = \App\Models\User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'mobile' => 'sometimes|required|string|max:20|unique:users,mobile,' . $user->id,
            'is_active' => 'sometimes|boolean',
            'password' => 'sometimes|nullable|string|min:8',
        ]);

        $data = $request->only(['name', 'email', 'mobile', 'is_active']);
        if ($request->filled('password')) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data' => $user->fresh()->load('roles', 'tenants'),
        ]);
    }

    /**
     * DELETE /api/v1/admin/users/{id}
     * Delete a user (Super Admin only).
     */
    public function deleteUser(int $id): JsonResponse
    {
        $this->authorize('manage_all_users');

        $user = \App\Models\User::findOrFail($id);

        // Prevent deleting self
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        // Revoke all tokens
        $user->tokens()->delete();
        // Detach from all tenants
        $user->tenants()->detach();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.',
        ]);
    }

    /**
     * PUT /api/v1/admin/users/{id}/toggle-active
     * Activate or deactivate a user.
     */
    public function toggleUserActive(int $id): JsonResponse
    {
        $this->authorize('manage_all_users');

        $user = \App\Models\User::findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'User activated.' : 'User deactivated.',
            'data' => $user,
        ]);
    }

    /**
     * GET /api/v1/admin/tenants
     * List all tenants in the system (Super Admin only).
     */
    public function tenants(Request $request): JsonResponse
    {
        $this->authorize('manage_all_tenants');

        $query = \App\Models\Tenant::withCount('users');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $tenants = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    /**
     * GET /api/v1/admin/tenants/{id}
     * Get single tenant details (Super Admin only).
     */
    public function showTenant(int $id): JsonResponse
    {
        $this->authorize('manage_all_tenants');

        $tenant = \App\Models\Tenant::withCount('users')
            ->with('users:id,name,mobile,email')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $tenant,
        ]);
    }

    /**
     * PUT /api/v1/admin/tenants/{id}
     * Update a tenant (Super Admin only).
     */
    public function updateTenant(Request $request, int $id): JsonResponse
    {
        $this->authorize('manage_all_tenants');

        $tenant = \App\Models\Tenant::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        $tenant->update($request->only(['name', 'address', 'city', 'phone', 'email', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Business updated successfully.',
            'data' => $tenant->fresh()->loadCount('users'),
        ]);
    }

    /**
     * DELETE /api/v1/admin/tenants/{id}
     * Delete a tenant (Super Admin only).
     */
    public function deleteTenant(int $id): JsonResponse
    {
        $this->authorize('manage_all_tenants');

        $tenant = \App\Models\Tenant::findOrFail($id);
        $tenant->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Business deactivated successfully.',
        ]);
    }

    /**
     * GET /api/v1/admin/dashboard
     * System-wide stats for Super Admin.
     */
    public function dashboard(): JsonResponse
    {
        $this->authorize('manage_system_settings');

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => \App\Models\User::count(),
                'active_users' => \App\Models\User::where('is_active', true)->count(),
                'total_tenants' => \App\Models\Tenant::count(),
                'active_tenants' => \App\Models\Tenant::where('is_active', true)->count(),
                'total_parties' => \App\Models\Party::count(),
                'total_transactions' => \App\Models\Transaction::count(),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/users
     * Detailed user report for Super Admin.
     */
    public function userReport(Request $request): JsonResponse
    {
        $this->authorize('manage_all_users');

        $users = \App\Models\User::with('roles', 'tenants')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'mobile' => $u->mobile,
                'email' => $u->email,
                'is_active' => $u->is_active,
                'roles' => $u->roles->pluck('name'),
                'business_count' => $u->tenants->count(),
                'last_login' => $u->last_login_at,
                'created_at' => $u->created_at?->format('Y-m-d'),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users,
                'total' => $users->count(),
                'active' => $users->where('is_active', true)->count(),
                'inactive' => $users->where('is_active', false)->count(),
                'by_role' => $users->flatMap(fn($u) => $u['roles'])->countBy()->toArray(),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/businesses
     * Detailed business report for Super Admin.
     */
    public function businessReport(): JsonResponse
    {
        $this->authorize('manage_all_tenants');

        $tenants = \App\Models\Tenant::withCount(['users', 'parties'])
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'is_active' => $t->is_active,
                'users_count' => $t->users_count,
                'parties_count' => $t->parties_count,
                'transaction_count' => \App\Models\Transaction::where('tenant_id', $t->id)->count(),
                'created_at' => $t->created_at?->format('Y-m-d'),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'businesses' => $tenants,
                'total' => $tenants->count(),
                'active' => $tenants->where('is_active', true)->count(),
                'total_users' => $tenants->sum('users_count'),
                'total_parties' => $tenants->sum('parties_count'),
                'total_transactions' => $tenants->sum('transaction_count'),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/activity
     * Recent activity across the system.
     */
    public function activityReport(): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $recentSessions = \App\Models\Session::with('user:id,name,mobile')
            ->where('is_active', true)
            ->orderByDesc('last_active_at')
            ->limit(50)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'user_name' => $s->user?->name,
                'user_mobile' => $s->user?->mobile,
                'device' => $s->display_name,
                'ip_address' => $s->ip_address,
                'location' => $s->geo_city ? "{$s->geo_city}, {$s->geo_country}" : ($s->location ?? '—'),
                'last_active_at' => $s->last_active_at,
                'login_at' => $s->login_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'sessions' => $recentSessions,
                'total_active_sessions' => \App\Models\Session::where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/financial
     * System-wide financial overview.
     */
    public function financialReport(): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $totalDebit = \App\Models\Transaction::where('type', 'debit')->sum('amount');
        $totalCredit = \App\Models\Transaction::where('type', 'credit')->sum('amount');
        $totalPayments = \App\Models\Payment::sum('amount');

        $monthlyVolume = \App\Models\Transaction::selectRaw("DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as count, SUM(amount) as total")
            ->where('date', '>=', now()->subMonths(12))
            ->groupBy('month')->orderBy('month')->get();

        $topBusinesses = \App\Models\Tenant::withCount('transactions')
            ->orderByDesc('transactions_count')->limit(10)->get()
            ->map(fn($t) => [
                'id' => $t->id, 'name' => $t->name,
                'transaction_count' => $t->transactions_count,
                'total_amount' => \App\Models\Transaction::where('tenant_id', $t->id)->sum('amount'),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_debit' => round($totalDebit, 2),
                'total_credit' => round($totalCredit, 2),
                'net_balance' => round($totalDebit - $totalCredit, 2),
                'total_payments' => round($totalPayments, 2),
                'total_transactions' => \App\Models\Transaction::count(),
                'monthly_volume' => $monthlyVolume,
                'top_businesses' => $topBusinesses,
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/business/{id}
     */
    public function businessDetailReport(int $id): JsonResponse
    {
        $this->authorize('manage_all_tenants');

        $tenant = \App\Models\Tenant::withCount(['users', 'parties', 'transactions', 'payments'])->findOrFail($id);
        $totalDebit = \App\Models\Transaction::where('tenant_id', $id)->where('type', 'debit')->sum('amount');
        $totalCredit = \App\Models\Transaction::where('tenant_id', $id)->where('type', 'credit')->sum('amount');
        $totalPayments = \App\Models\Payment::where('tenant_id', $id)->sum('amount');

        $topParties = \App\Models\Party::where('tenant_id', $id)
            ->withCount('transactions')->orderByDesc('transactions_count')->limit(10)->get()
            ->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'type' => $p->type, 'transaction_count' => $p->transactions_count, 'current_balance' => $p->current_balance]);

        $monthlyVolume = \App\Models\Transaction::where('tenant_id', $id)
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as count, SUM(amount) as total")
            ->where('date', '>=', now()->subMonths(12))
            ->groupBy('month')->orderBy('month')->get();

        $team = $tenant->users()->get()->map(fn($u) => [
            'id' => $u->id, 'name' => $u->name, 'mobile' => $u->mobile,
            'roles' => $u->roles->pluck('name'), 'is_active' => $u->is_active,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'business' => ['id' => $tenant->id, 'name' => $tenant->name, 'is_active' => $tenant->is_active, 'created_at' => $tenant->created_at?->format('Y-m-d')],
                'stats' => [
                    'users_count' => $tenant->users_count, 'parties_count' => $tenant->parties_count,
                    'transactions_count' => $tenant->transactions_count, 'payments_count' => $tenant->payments_count,
                    'total_debit' => round($totalDebit, 2), 'total_credit' => round($totalCredit, 2),
                    'net_balance' => round($totalDebit - $totalCredit, 2), 'total_payments' => round($totalPayments, 2),
                ],
                'top_parties' => $topParties, 'monthly_volume' => $monthlyVolume, 'team' => $team,
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/growth
     */
    public function growthReport(): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $userGrowth = \App\Models\User::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->where('created_at', '>=', now()->subMonths(12))->groupBy('month')->orderBy('month')->get();
        $businessGrowth = \App\Models\Tenant::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->where('created_at', '>=', now()->subMonths(12))->groupBy('month')->orderBy('month')->get();
        $partyGrowth = \App\Models\Party::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->where('created_at', '>=', now()->subMonths(12))->groupBy('month')->orderBy('month')->get();
        $txnGrowth = \App\Models\Transaction::selectRaw("DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as count, SUM(amount) as total_amount")
            ->where('date', '>=', now()->subMonths(12))->groupBy('month')->orderBy('month')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'user_growth' => $userGrowth, 'business_growth' => $businessGrowth,
                'party_growth' => $partyGrowth, 'transaction_growth' => $txnGrowth,
                'totals' => [
                    'users' => \App\Models\User::count(), 'businesses' => \App\Models\Tenant::count(),
                    'parties' => \App\Models\Party::count(), 'transactions' => \App\Models\Transaction::count(),
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/payment-summary
     */
    public function paymentReport(): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $payments = \App\Models\Payment::selectRaw("payment_method, COUNT(*) as count, SUM(amount) as total_amount,
            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount"
        )->groupBy('payment_method')->get();

        $monthlyPayments = \App\Models\Payment::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count, SUM(amount) as total")
            ->where('status', 'completed')->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('month')->orderBy('month')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'by_method' => $payments, 'monthly' => $monthlyPayments,
                'total_collected' => \App\Models\Payment::where('status', 'completed')->sum('amount'),
                'total_pending' => \App\Models\Payment::where('status', 'pending')->sum('amount'),
                'total_count' => \App\Models\Payment::count(),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/sessions
     */
    public function sessionReport(): JsonResponse
    {
        $this->authorize('manage_system_settings');

        $byBrowser = \App\Models\Session::selectRaw("browser, COUNT(*) as count")->groupBy('browser')->orderByDesc('count')->get();
        $byOs = \App\Models\Session::selectRaw("os, COUNT(*) as count")->groupBy('os')->orderByDesc('count')->get();
        $byDevice = \App\Models\Session::selectRaw("device_type, COUNT(*) as count")->groupBy('device_type')->orderByDesc('count')->get();
        $dailyLogins = \App\Models\Session::selectRaw("DATE(login_at) as date, COUNT(*) as count")
            ->where('login_at', '>=', now()->subDays(30))->groupBy('date')->orderBy('date')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'active_sessions' => \App\Models\Session::where('is_active', true)->count(),
                'total_sessions' => \App\Models\Session::count(),
                'by_browser' => $byBrowser, 'by_os' => $byOs, 'by_device' => $byDevice,
                'daily_logins' => $dailyLogins,
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/users/{id}/impersonate
     * Generate a temporary token to impersonate a user.
     */
    public function impersonateUser(int $id): JsonResponse
    {
        $this->authorize('manage_all_users');

        $admin = auth()->user();
        $targetUser = User::with('roles', 'tenants')->findOrFail($id);

        // Prevent self-impersonation
        if ($admin->id === $targetUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot impersonate yourself.',
            ], 422);
        }

        // Create a temporary token for impersonation (1 hour expiry handled by client)
        $token = $targetUser->createToken('impersonation-token');

        // Log the impersonation
        app(ActivityLogService::class)->logAction(
            'impersonate',
            "Admin {$admin->name} (#{$admin->id}) started impersonating {$targetUser->name} (#{$targetUser->id})"
        );

        return response()->json([
            'success' => true,
            'message' => "Now impersonating {$targetUser->name}",
            'data' => [
                'user' => $targetUser,
                'token' => $token->plainTextToken,
                'tenants' => $targetUser->tenants,
                'impersonating' => true,
                'original_admin_id' => $admin->id,
                'original_admin_name' => $admin->name,
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/impersonate/stop
     * Stop impersonation — revoke the impersonation token.
     */
    public function stopImpersonation(Request $request): JsonResponse
    {
        $this->authorize('manage_all_users');

        // Revoke the current impersonation token
        $request->user()->currentAccessToken()->delete();

        app(ActivityLogService::class)->logAction(
            'impersonate_stop',
            "Admin stopped impersonation"
        );

        return response()->json([
            'success' => true,
            'message' => 'Impersonation ended. Please use your original session.',
        ]);
    }
}
