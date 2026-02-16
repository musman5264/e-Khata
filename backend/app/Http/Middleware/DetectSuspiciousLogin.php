<?php

namespace App\Http\Middleware;

use App\Events\NewDeviceLogin;
use App\Models\Session;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DetectSuspiciousLogin
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();
        if (!$user) {
            return $response;
        }

        $deviceId = $request->header('X-Device-ID');
        if (!$deviceId) {
            return $response;
        }

        try {
            // Check if this device has been used before
            $knownDevice = Session::where('user_id', $user->id)
                ->where('device_id', $deviceId)
                ->exists();

            if (!$knownDevice) {
                // Check for geo anomalies
                $lastSession = Session::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->where('device_id', '!=', $deviceId)
                    ->orderByDesc('last_active_at')
                    ->first();

                $currentSession = Session::where('user_id', $user->id)
                    ->where('device_id', $deviceId)
                    ->where('is_active', true)
                    ->first();

                if ($currentSession) {
                    $isSuspicious = false;

                    // Different country
                    if ($lastSession && $lastSession->geo_country && $currentSession->geo_country
                        && $lastSession->geo_country !== $currentSession->geo_country) {
                        $isSuspicious = true;
                    }

                    event(new NewDeviceLogin($user, $currentSession, $isSuspicious));
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return $response;
    }
}
