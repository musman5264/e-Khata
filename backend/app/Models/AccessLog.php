<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'session_id',
        'method',
        'url',
        'route_name',
        'request_headers',
        'request_body',
        'response_status',
        'response_time_ms',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'request_headers' => 'array',
        'request_body' => 'array',
        'created_at' => 'datetime',
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

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }
}
