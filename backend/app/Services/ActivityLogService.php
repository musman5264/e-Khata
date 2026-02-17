<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Session;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Resolve the current session ID from the active request.
     */
    protected function resolveSessionId(): ?string
    {
        $user = Auth::user();
        $request = request();

        if (!$user || !$request) {
            return null;
        }

        // Try to find session by device_id header
        $deviceId = $request->header('X-Device-ID');
        if ($deviceId) {
            $session = Session::where('user_id', $user->id)
                ->where('device_id', $deviceId)
                ->where('is_active', true)
                ->first();
            if ($session) {
                return $session->id;
            }
        }

        // Fallback: find session by current token_id
        $token = $user->currentAccessToken();
        if ($token) {
            $session = Session::where('user_id', $user->id)
                ->where('token_id', $token->id)
                ->where('is_active', true)
                ->first();
            if ($session) {
                return $session->id;
            }
        }

        return null;
    }

    /**
     * Log a user activity.
     */
    public function log(
        string $action,
        ?Model $model = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): ActivityLog {
        $user = Auth::user();
        $tenant = app()->bound('currentTenant') ? app('currentTenant') : null;
        $request = request();

        return ActivityLog::create([
            'tenant_id' => $tenant?->id,
            'user_id' => $user?->id,
            'session_id' => $this->resolveSessionId(),
            'action' => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->getKey(),
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'device_type' => $request?->header('X-Device-Name'),
            'platform' => $request?->header('X-OS-Name'),
            'geo_location' => null,
            'created_at' => now(),
        ]);
    }

    /**
     * Log a simple action without a model.
     */
    public function logAction(string $action, ?string $description = null, ?array $data = null): ActivityLog
    {
        return $this->log(
            action: $action,
            description: $description,
            newValues: $data,
        );
    }
}
