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
     * Enforces ONE session per device per user — any existing active session
     * on the same device (or from the same browser fingerprint) is deactivated.
     */
    public function createSession(User $user, Request $request, ?int $tokenId = null, ?int $tenantId = null): Session
    {
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        // Build a device fingerprint for dedup
        $deviceId = $request->header('X-Device-ID');
        $browserName = $agent->browser() ?: null;
        $browserVersion = $agent->version($agent->browser()) ?: null;
        $osName = $request->header('X-OS-Name') ?: ($agent->platform() ?: null);
        $osVersion = $request->header('X-OS-Version') ?: ($agent->version($agent->platform()) ?: null);
        $deviceName = $request->header('X-Device-Name') ?: ($agent->device() ?: null);

        // ── Deactivate existing sessions for this user on the same device ──
        $this->deactivatePreviousSessions($user, $deviceId, $browserName, $osName, $request->userAgent());

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
            'device_id' => $deviceId,
            'device_name' => $deviceName,
            'device_model' => $request->header('X-Device-Model'),
            'device_brand' => $request->header('X-Device-Brand'),
            'os_name' => $osName,
            'os_version' => $osVersion,
            'app_version' => $request->header('X-App-Version'),
            'browser_name' => $browserName,
            'browser_version' => $browserVersion,
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
     * Deactivate any previous active sessions for the same user on the same device.
     * Uses device_id if available; falls back to browser+OS fingerprint matching.
     */
    protected function deactivatePreviousSessions(User $user, ?string $deviceId, ?string $browserName, ?string $osName, ?string $userAgent): void
    {
        $query = Session::where('user_id', $user->id)
            ->where('is_active', true);

        if ($deviceId) {
            // Mobile app sends X-Device-ID — match exactly
            $query->where('device_id', $deviceId);
        } elseif ($browserName && $osName) {
            // Web browser — match by browser + OS combination (same device fingerprint)
            $query->where('browser_name', $browserName)
                  ->where('os_name', $osName);
        } else {
            // Last resort — match by full user-agent string
            // Don't deactivate if we can't reliably identify the device
            return;
        }

        $existingSessions = $query->get();

        foreach ($existingSessions as $session) {
            $session->deactivate();

            // Revoke the associated Sanctum token so the old session is truly logged out
            if ($session->token_id) {
                \Laravel\Sanctum\PersonalAccessToken::where('id', $session->token_id)->delete();
            }
        }
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
     * Enforce single-device policy: if the user is already logged in on another device,
     * deactivate that session. Called during login to ensure only the current device is active.
     */
    public function enforceOneActiveDevice(User $user, string $currentSessionId): int
    {
        $sessions = Session::where('user_id', $user->id)
            ->where('is_active', true)
            ->where('id', '!=', $currentSessionId)
            ->get();

        foreach ($sessions as $session) {
            $session->deactivate();
            if ($session->token_id) {
                \Laravel\Sanctum\PersonalAccessToken::where('id', $session->token_id)->delete();
            }
        }

        return $sessions->count();
    }

    /**
     * Clean up duplicate/stale sessions — keeps only the latest active session per user per device.
     */
    public function cleanupDuplicateSessions(): int
    {
        $cleaned = 0;

        // Get all users with active sessions
        $userIds = Session::where('is_active', true)
            ->distinct()
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $sessions = Session::where('user_id', $userId)
                ->where('is_active', true)
                ->orderByDesc('login_at')
                ->get();

            // Group by device fingerprint (device_id or browser+os)
            $grouped = $sessions->groupBy(function ($session) {
                if ($session->device_id) {
                    return 'device:' . $session->device_id;
                }
                return 'browser:' . ($session->browser_name ?? 'unknown') . ':' . ($session->os_name ?? 'unknown');
            });

            foreach ($grouped as $deviceKey => $deviceSessions) {
                // Keep the latest, deactivate the rest
                $deviceSessions->skip(1)->each(function ($session) use (&$cleaned) {
                    $session->deactivate();
                    if ($session->token_id) {
                        \Laravel\Sanctum\PersonalAccessToken::where('id', $session->token_id)->delete();
                    }
                    $cleaned++;
                });
            }
        }

        return $cleaned;
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
