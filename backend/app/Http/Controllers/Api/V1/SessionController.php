<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
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
}
