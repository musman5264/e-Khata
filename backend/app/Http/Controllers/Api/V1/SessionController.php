<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Session;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    protected SessionService $sessionService;

    public function __construct(SessionService $sessionService)
    {
        $this->sessionService = $sessionService;
    }

    /**
     * GET /api/v1/sessions
     * List all active sessions for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = Session::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->orderByDesc('last_active_at')
            ->get()
            ->map(fn($session) => [
                'id' => $session->id,
                'device_name' => $session->display_name,
                'device_model' => $session->device_model,
                'device_brand' => $session->device_brand,
                'os_name' => $session->os_name,
                'os_version' => $session->os_version,
                'browser_name' => $session->browser_name,
                'app_version' => $session->app_version,
                'ip_address' => $session->ip_address,
                'location' => $session->location,
                'geo_country' => $session->geo_country,
                'geo_city' => $session->geo_city,
                'last_active_at' => $session->last_active_at,
                'login_at' => $session->login_at,
                'is_current' => $session->token_id === $request->user()->currentAccessToken()?->id,
            ]);

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * GET /api/v1/sessions/current
     * Current session details.
     */
    public function current(Request $request): JsonResponse
    {
        $tokenId = $request->user()->currentAccessToken()?->id;

        $session = Session::where('user_id', $request->user()->id)
            ->where('token_id', $tokenId)
            ->where('is_active', true)
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Current session not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $session,
        ]);
    }

    /**
     * DELETE /api/v1/sessions/{id}
     * Revoke a specific session (logs out that device).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $session = Session::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->where('is_active', true)
            ->firstOrFail();

        $this->sessionService->revokeSession($session, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Session revoked successfully.',
        ]);
    }

    /**
     * DELETE /api/v1/sessions/all-except-current
     * Log out from all other devices.
     */
    public function revokeAllExceptCurrent(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        $count = $this->sessionService->revokeAllExcept($request->user(), $currentTokenId);

        return response()->json([
            'success' => true,
            'message' => "{$count} session(s) revoked.",
            'data' => ['revoked_count' => $count],
        ]);
    }

    /**
     * PUT /api/v1/sessions/fcm-token
     * Update FCM token for the current session.
     */
    public function updateFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcm_token' => 'required|string|max:500',
        ]);

        $tokenId = $request->user()->currentAccessToken()?->id;

        $session = Session::where('user_id', $request->user()->id)
            ->where('token_id', $tokenId)
            ->where('is_active', true)
            ->first();

        if ($session) {
            $session->update(['fcm_token' => $request->fcm_token]);
        }

        return response()->json([
            'success' => true,
            'message' => 'FCM token updated.',
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // SUPER ADMIN SESSION METHODS
    // ══════════════════════════════════════════════════════════

    /**
     * GET /api/v1/admin/sessions
     * List all sessions across all users (Super Admin).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Session::with('user:id,name,mobile,email')
            ->orderByDesc('last_active_at');

        // Filters
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('device_name', 'like', "%{$search}%")
                  ->orWhere('device_model', 'like', "%{$search}%")
                  ->orWhere('device_brand', 'like', "%{$search}%")
                  ->orWhere('browser_name', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('geo_city', 'like', "%{$search}%")
                  ->orWhere('geo_country', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('mobile', 'like', "%{$search}%");
                  });
            });
        }

        $sessions = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * GET /api/v1/admin/sessions/{id}
     * Detailed session info (Super Admin).
     */
    public function adminShow(Request $request, string $id): JsonResponse
    {
        $session = Session::with('user:id,name,mobile,email')
            ->findOrFail($id);

        $activityCount = ActivityLog::where('session_id', $id)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $session->id,
                'user' => $session->user,
                'device_name' => $session->display_name,
                'device_id' => $session->device_id,
                'device_model' => $session->device_model,
                'device_brand' => $session->device_brand,
                'os_name' => $session->os_name,
                'os_version' => $session->os_version,
                'browser_name' => $session->browser_name,
                'browser_version' => $session->browser_version,
                'app_version' => $session->app_version,
                'ip_address' => $session->ip_address,
                'last_ip_address' => $session->last_ip_address,
                'location' => $session->location,
                'geo_country' => $session->geo_country,
                'geo_city' => $session->geo_city,
                'geo_lat' => $session->geo_lat,
                'geo_lng' => $session->geo_lng,
                'fcm_token' => $session->fcm_token ? 'Set' : 'Not set',
                'is_active' => $session->is_active,
                'login_at' => $session->login_at,
                'logout_at' => $session->logout_at,
                'last_active_at' => $session->last_active_at,
                'activity_count' => $activityCount,
                'created_at' => $session->created_at,
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/sessions/{id}/activities
     * Activity log for a specific session (Super Admin).
     */
    public function sessionActivities(Request $request, string $id): JsonResponse
    {
        $query = ActivityLog::where('session_id', $id)
            ->with('user:id,name')
            ->orderByDesc('created_at');

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('model_type', 'like', "%{$search}%");
            });
        }

        // Action filter
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        $activities = $query->paginate($request->get('per_page', 30));

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }

    /**
     * DELETE /api/v1/admin/sessions/{id}
     * Force revoke any session (Super Admin).
     */
    public function adminDestroy(Request $request, string $id): JsonResponse
    {
        $session = Session::findOrFail($id);

        $this->sessionService->revokeSession($session, $session->user);

        return response()->json([
            'success' => true,
            'message' => 'Session revoked by admin.',
        ]);
    }

    /**
     * POST /api/v1/admin/sessions/cleanup
     * Clean up duplicate sessions — keep only latest per user per device (Super Admin).
     */
    public function cleanupDuplicates(Request $request): JsonResponse
    {
        $cleaned = $this->sessionService->cleanupDuplicateSessions();

        return response()->json([
            'success' => true,
            'message' => "Cleaned up {$cleaned} duplicate session(s).",
            'data' => ['cleaned_count' => $cleaned],
        ]);
    }
}
