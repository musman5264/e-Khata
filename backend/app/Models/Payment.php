<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    use BelongsToTenant, LogsActivity;

    protected $fillable = [
        'tenant_id',
        'party_id',
        'gateway',
        'direction',
        'amount',
        'currency',
        'status',
        'gateway_txn_ref',
        'gateway_response',
        'pp_TxnRefNo',
        'pp_ReturnURL',
        'initiated_by',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    /**
     * Check if payment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if payment is inbound (collection).
     */
    public function isInbound(): bool
    {
        return $this->direction === 'inbound';
    }
}
