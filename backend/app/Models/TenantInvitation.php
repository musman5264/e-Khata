<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantInvitation extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'invited_by',
        'mobile',
        'email',
        'role_id',
        'token',
        'status',
        'accepted_at',
        'expires_at',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Check if invitation is valid (pending + not expired).
     */
    public function isValid(): bool
    {
        return $this->status === 'pending'
            && (!$this->expires_at || $this->expires_at->isFuture());
    }

    /**
     * Accept the invitation.
     */
    public function accept(): void
    {
        $this->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);
    }
}
