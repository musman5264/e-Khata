<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PaymentLink extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'party_id',
        'created_by',
        'token',
        'amount',
        'currency',
        'gateway',
        'description',
        'status',
        'payment_id',
        'expires_at',
        'paid_at',
        'payer_mobile',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    /**
     * Generate a unique token for the payment link.
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(32);
        } while (self::where('token', $token)->exists());

        return $token;
    }

    /**
     * Get the full shareable URL for this payment link.
     */
    public function getShareableUrlAttribute(): string
    {
        return config('app.url') . '/pay/' . $this->token;
    }

    /**
     * Check if the link is still active and not expired.
     */
    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }
        return true;
    }

    /**
     * Mark as paid.
     */
    public function markAsPaid(?int $paymentId = null, ?string $payerMobile = null): void
    {
        $this->update([
            'status' => 'paid',
            'payment_id' => $paymentId,
            'paid_at' => now(),
            'payer_mobile' => $payerMobile,
        ]);
    }

    // ── Relationships ──

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
