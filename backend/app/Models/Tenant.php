<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'address',
        'city',
        'phone',
        'email',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Default tenant settings.
     */
    public static function defaultSettings(): array
    {
        return [
            'currency' => 'PKR',
            'currency_symbol' => 'Rs.',
            'date_format' => 'DD MMM YYYY',
            'fiscal_year_start' => '07-01',
            'timezone' => 'Asia/Karachi',
            'language' => 'en',
            'opening_balance_date' => now()->format('Y-01-01'),
            'balance_alert_threshold' => 50000,
            'auto_share_on_transaction' => false,
            'require_description' => true,
            'require_reference_number' => false,
            'allow_future_dates' => false,
            'allow_negative_balance' => true,
            'pdf_template' => 'classic',
            'notification_defaults' => ['new_transaction' => true, 'payment' => true],
            'payment_gateways' => ['jazzcash' => true, 'easypaisa' => true],
        ];
    }

    public function getSetting(string $key, mixed $default = null): mixed
    {
        return data_get($this->settings, $key, $default);
    }

    // Relationships
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withPivot('joined_at');
    }

    public function parties(): HasMany
    {
        return $this->hasMany(Party::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(TenantInvitation::class);
    }
}
