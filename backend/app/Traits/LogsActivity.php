<?php

namespace App\Traits;

use App\Services\ActivityLogService;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            app(ActivityLogService::class)->log(
                action: 'created',
                model: $model,
                description: class_basename($model) . ' created',
                newValues: $model->getAttributes()
            );
        });

        static::updated(function ($model) {
            $dirty = $model->getDirty();
            $original = collect($dirty)->mapWithKeys(fn($v, $k) => [$k => $model->getOriginal($k)])->toArray();

            if (!empty($dirty)) {
                app(ActivityLogService::class)->log(
                    action: 'updated',
                    model: $model,
                    description: class_basename($model) . ' updated',
                    oldValues: $original,
                    newValues: $dirty
                );
            }
        });

        static::deleted(function ($model) {
            app(ActivityLogService::class)->log(
                action: 'deleted',
                model: $model,
                description: class_basename($model) . ' deleted',
                oldValues: $model->getAttributes()
            );
        });
    }
}
