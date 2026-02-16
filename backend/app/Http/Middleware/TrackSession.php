<?php

namespace App\Http\Middleware;

use App\Models\Session;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();
        if (!$user) {
            return $response;
        }

        // Find active session by device_id or token
        $deviceId = $request->header('X-Device-ID');
        $session = null;

        if ($deviceId) {
            $session = Session::where('user_id', $user->id)
                ->where('device_id', $deviceId)
                ->where('is_active', true)
                ->first();
        }

        if ($session) {
            $session->update([
                'last_active_at' => now(),
                'last_ip_address' => $request->ip(),
            ]);

            // Update FCM token if provided
            $fcmToken = $request->header('X-FCM-Token');
            if ($fcmToken && $session->fcm_token !== $fcmToken) {
                $session->update(['fcm_token' => $fcmToken]);
            }
        }

        return $response;
    }
}
