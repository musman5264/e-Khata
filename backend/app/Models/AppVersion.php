<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppVersion extends Model
{
    protected $fillable = [
        'version',
        'title',
        'changelog',
        'channel',
        'platform',
        'is_current',
        'force_update',
        'release_date',
        'released_by',
    ];

    protected $casts = [
        'is_current'   => 'boolean',
        'force_update'  => 'boolean',
        'release_date'  => 'date',
    ];

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'released_by');
    }

    /**
     * Get the current active version.
     */
    public static function current(?string $platform = 'all'): ?self
    {
        return static::where('is_current', true)
            ->where(function ($q) use ($platform) {
                $q->where('platform', 'all')
                  ->orWhere('platform', $platform);
            })
            ->orderByDesc('release_date')
            ->first();
    }
}
