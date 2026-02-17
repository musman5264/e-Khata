<?php

namespace App\Services;

use App\Models\Session;
use App\Models\User;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;
use Stevebauman\Location\Facades\Location;

class SessionService
{
    /**
     * Create a new session record on login.
     */
    public function createSession(User $user, Request $request, ?int $tokenId = null, ?int $tenantId = null): Session
    {
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        $location = null;
        try {
            $result = Location::get($request->ip());
            $location = ($result && is_object($result)) ? $result : null;
        } catch (\Throwable $e) {
            // IP geolocation may fail, that's ok
        }

        return Session::create([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'token_id' => $tokenId,
            'device_id' => $request->header('X-Device-ID'),
            'device_name' => $request->header('X-Device-Name') ?: ($agent->device() ?: null),
            'device_model' => $request->header('X-Device-Model'),
            'device_brand' => $request->header('X-Device-Brand'),
            'os_name' => $request->header('X-OS-Name') ?: ($agent->platform() ?: null),
            'os_version' => $request->header('X-OS-Version') ?: ($agent->version($agent->platform()) ?: null),
            'app_version' => $request->header('X-App-Version'),
            'browser_name' => $agent->browser() ?: null,
            'browser_version' => $agent->version($agent->browser()) ?: null,
            'ip_address' => $request->ip(),
            'last_ip_address' => $request->ip(),
            'geo_country' => $location?->countryName,
            'geo_city' => $location?->cityName,
            'geo_lat' => $location?->latitude,
            'geo_lng' => $location?->longitude,
            'fcm_token' => $request->header('X-FCM-Token'),
            'is_active' => true,
            'last_active_at' => now(),
            'login_at' => now(),
        ]);
    }

    /**
     * Deactivate a session.
     * Accepts a Session object, session ID string, or any value.
     */
    public function revokeSession(mixed $session, ?User $user = null): void
    {
        if (is_string($session)) {
            $session = Session::findOrFail($session);
        }

        if ($session instanceof Session) {
            $session->deactivate();

            // Also revoke the associated Sanctum token if possible
            if ($session->token_id) {
                \Laravel\Sanctum\PersonalAccessToken::where('id', $session->token_id)->delete();
            }
        }
    }

    /**
     * Revoke all sessions except the current one.
     * Accepts User object or user ID, and session ID or token ID.
     */
    public function revokeAllExcept(mixed $userOrId, mixed $currentIdentifier): int
    {
        $userId = $userOrId instanceof User ? $userOrId->id : $userOrId;

        // Try to find the current session by token_id first, then by session id
        $currentSession = Session::where('user_id', $userId)
            ->where('is_active', true)
            ->where(function ($q) use ($currentIdentifier) {
                $q->where('id', $currentIdentifier)
                  ->orWhere('token_id', $currentIdentifier);
            })
            ->first();

        $query = Session::where('user_id', $userId)
            ->where('is_active', true);

        if ($currentSession) {
            $query->where('id', '!=', $currentSession->id);
        }

        $sessions = $query->get();

        foreach ($sessions as $session) {
            $session->deactivate();
            if ($session->token_id) {
                \Laravel\Sanctum\PersonalAccessToken::where('id', $session->token_id)->delete();
            }
        }

        return $sessions->count();
    }
}
