<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Party extends Model
{
    use BelongsToTenant, LogsActivity, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'mobile',
        'email',
        'address',
        'city',
        'khata_number',
        'book_number',
        'type',
        'opening_balance',
        'opening_balance_type',
        'notes',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function ledgerShares(): HasMany
    {
        return $this->hasMany(LedgerShare::class);
    }

    /**
     * Get the current balance of this party.
     * Positive = party owes us (receivable/debit), Negative = we owe party (payable/credit).
     */
    public function getCurrentBalanceAttribute(): float
    {
        $lastTransaction = $this->transactions()
            ->whereNull('deleted_at')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->first();

        if ($lastTransaction) {
            return (float) $lastTransaction->running_balance;
        }

        return $this->opening_balance_type === 'dr'
            ? (float) $this->opening_balance
            : -(float) $this->opening_balance;
    }

    /**
     * Total debit amount.
     */
    public function getTotalDebitAttribute(): float
    {
        return (float) $this->transactions()
            ->whereNull('deleted_at')
            ->where('type', 'debit')
            ->sum('amount');
    }

    /**
     * Total credit amount.
     */
    public function getTotalCreditAttribute(): float
    {
        return (float) $this->transactions()
            ->whereNull('deleted_at')
            ->where('type', 'credit')
            ->sum('amount');
    }
}
