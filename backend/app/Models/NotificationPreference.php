<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'push_enabled',
        'in_app_enabled',
        'email_enabled',
    ];

    protected $casts = [
        'push_enabled' => 'boolean',
        'in_app_enabled' => 'boolean',
        'email_enabled' => 'boolean',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
