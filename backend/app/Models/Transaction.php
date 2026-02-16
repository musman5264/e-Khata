<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasRunningBalance;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use BelongsToTenant, HasRunningBalance, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'party_id',
        'user_id',
        'type',
        'amount',
        'running_balance',
        'date',
        'description',
        'reference_number',
        'attachment_url',
        'payment_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'running_balance' => 'decimal:2',
        'date' => 'date',
    ];

    // Relationships
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Get formatted debit amount (only if type is debit).
     */
    public function getDebitAmountAttribute(): ?float
    {
        return $this->type === 'debit' ? (float) $this->amount : null;
    }

    /**
     * Get formatted credit amount (only if type is credit).
     */
    public function getCreditAmountAttribute(): ?float
    {
        return $this->type === 'credit' ? (float) $this->amount : null;
    }

    /**
     * Get balance display string (e.g., "15,000 Dr" or "5,000 Cr").
     */
    public function getBalanceDisplayAttribute(): string
    {
        $balance = (float) $this->running_balance;
        $formatted = number_format(abs($balance), 2);
        return $balance >= 0 ? "{$formatted} Dr" : "{$formatted} Cr";
    }
}
