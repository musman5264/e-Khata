<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Session extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'token_id',
        'device_id',
        'device_name',
        'device_model',
        'device_brand',
        'os_name',
        'os_version',
        'app_version',
        'browser_name',
        'browser_version',
        'ip_address',
        'last_ip_address',
        'geo_country',
        'geo_city',
        'geo_lat',
        'geo_lng',
        'fcm_token',
        'is_active',
        'last_active_at',
        'login_at',
        'logout_at',
    ];

    protected $casts = [
        'geo_lat' => 'decimal:7',
        'geo_lng' => 'decimal:7',
        'is_active' => 'boolean',
        'last_active_at' => 'datetime',
        'login_at' => 'datetime',
        'logout_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Deactivate this session.
     */
    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
            'logout_at' => now(),
        ]);
    }

    /**
     * Get display name for the session.
     */
    public function getDisplayNameAttribute(): string
    {
        $parts = array_filter([
            $this->device_brand,
            $this->device_model ?: $this->device_name,
        ]);

        if (empty($parts) && $this->browser_name) {
            $parts = [$this->browser_name, $this->os_name];
        }

        return implode(' ', array_filter($parts)) ?: 'Unknown Device';
    }

    /**
     * Get location string.
     */
    public function getLocationAttribute(): string
    {
        return implode(', ', array_filter([$this->geo_city, $this->geo_country])) ?: 'Unknown';
    }
}
