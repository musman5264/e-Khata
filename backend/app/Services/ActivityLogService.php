<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
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
            'session_id' => null,
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
