<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
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
}
