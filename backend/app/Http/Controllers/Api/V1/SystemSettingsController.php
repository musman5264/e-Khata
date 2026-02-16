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
    public function users(): JsonResponse
    {
        $this->authorize('manage_all_users');

        $users = \App\Models\User::with('roles', 'tenants')
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $users,
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
    public function tenants(): JsonResponse
    {
        $this->authorize('manage_all_tenants');

        $tenants = \App\Models\Tenant::withCount('users')
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $tenants,
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
}
