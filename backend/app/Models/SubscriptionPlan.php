<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\LogsActivity;

class SubscriptionPlan extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_cycle',
        'duration_days',
        'max_parties',
        'max_users',
        'max_transactions',
        'has_reports',
        'has_payment_links',
        'has_sms',
        'has_whatsapp',
        'features',
        'trial_days',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'duration_days' => 'integer',
        'max_parties' => 'integer',
        'max_users' => 'integer',
        'max_transactions' => 'integer',
        'has_reports' => 'boolean',
        'has_payment_links' => 'boolean',
        'has_sms' => 'boolean',
        'has_whatsapp' => 'boolean',
        'features' => 'array',
        'trial_days' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /* ── Relations ── */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    /* ── Helpers ── */
    public function isMonthly(): bool
    {
        return $this->billing_cycle === 'monthly';
    }

    public function isYearly(): bool
    {
        return $this->billing_cycle === 'yearly';
    }

    /**
     * Format the price for display.
     */
    public function getFormattedPriceAttribute(): string
    {
        return 'Rs. ' . number_format($this->price, 2);
    }

    /**
     * Get price per month (for yearly plans, divide by 12).
     */
    public function getMonthlyPriceAttribute(): float
    {
        return $this->isYearly() ? round($this->price / 12, 2) : $this->price;
    }
}
