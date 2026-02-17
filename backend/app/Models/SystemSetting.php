<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'is_mandatory',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
    ];

    /**
     * Get a setting value by key.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) return $default;

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $setting->value,
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    /**
     * Set a setting value by key.
     */
    public static function setValue(string $key, mixed $value): void
    {
        $setting = static::where('key', $key)->first();
        if ($setting) {
            $settingValue = is_array($value) ? json_encode($value) : (string) $value;
            $setting->update(['value' => $settingValue]);
        }
    }

    /**
     * Get all settings grouped.
     */
    public static function allGrouped(): array
    {
        return static::all()
            ->groupBy('group')
            ->map(fn ($items) => $items->map(fn ($item) => [
                'key' => $item->key,
                'value' => $item->value,
                'type' => $item->type,
                'label' => $item->label,
                'description' => $item->description,
                'is_mandatory' => $item->is_mandatory,
            ])->values())
            ->toArray();
    }

    /**
     * Get default system settings for initial seeding.
     */
    public static function defaults(): array
    {
        return [
            // General
            ['key' => 'app_name', 'value' => 'e-Khata', 'type' => 'string', 'group' => 'general', 'label' => 'Application Name', 'description' => 'The name displayed across the application', 'is_mandatory' => true],
            ['key' => 'default_currency', 'value' => 'PKR', 'type' => 'string', 'group' => 'general', 'label' => 'Default Currency', 'description' => 'Default currency for all tenants (PKR, USD, etc.)', 'is_mandatory' => true],
            ['key' => 'fiscal_year_start', 'value' => '7', 'type' => 'integer', 'group' => 'general', 'label' => 'Fiscal Year Start Month', 'description' => 'Month number when fiscal year starts (1=Jan, 7=Jul)', 'is_mandatory' => true],
            ['key' => 'date_format', 'value' => 'DD/MM/YYYY', 'type' => 'string', 'group' => 'general', 'label' => 'Date Format', 'description' => 'Default date display format', 'is_mandatory' => true],

            // Registration
            ['key' => 'allow_registration', 'value' => 'true', 'type' => 'boolean', 'group' => 'registration', 'label' => 'Allow Registration', 'description' => 'Enable or disable new user registration', 'is_mandatory' => true],
            ['key' => 'max_tenants_per_user', 'value' => '3', 'type' => 'integer', 'group' => 'registration', 'label' => 'Max Businesses Per User', 'description' => 'Maximum number of businesses a user can create', 'is_mandatory' => true],
            ['key' => 'require_mobile_verification', 'value' => 'false', 'type' => 'boolean', 'group' => 'registration', 'label' => 'Require Mobile Verification', 'description' => 'Require OTP verification for new registrations', 'is_mandatory' => false],

            // Localization
            ['key' => 'default_language', 'value' => 'en', 'type' => 'string', 'group' => 'localization', 'label' => 'Default Language', 'description' => 'Default language for new users (en, ur)', 'is_mandatory' => true],
            ['key' => 'timezone', 'value' => 'Asia/Karachi', 'type' => 'string', 'group' => 'localization', 'label' => 'Timezone', 'description' => 'Default system timezone', 'is_mandatory' => true],

            // Support
            ['key' => 'support_email', 'value' => 'support@ekhata.pk', 'type' => 'string', 'group' => 'support', 'label' => 'Support Email', 'description' => 'Support contact email address', 'is_mandatory' => true],
            ['key' => 'support_phone', 'value' => '+923001234567', 'type' => 'string', 'group' => 'support', 'label' => 'Support Phone', 'description' => 'Support contact phone number', 'is_mandatory' => true],
            ['key' => 'terms_url', 'value' => '', 'type' => 'string', 'group' => 'support', 'label' => 'Terms of Service URL', 'description' => 'Link to Terms of Service page', 'is_mandatory' => false],
            ['key' => 'privacy_url', 'value' => '', 'type' => 'string', 'group' => 'support', 'label' => 'Privacy Policy URL', 'description' => 'Link to Privacy Policy page', 'is_mandatory' => false],

            // System
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'system', 'label' => 'Maintenance Mode', 'description' => 'Put the application in maintenance mode', 'is_mandatory' => false],

            // SMS Gateway
            ['key' => 'sms_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'sms', 'label' => 'Enable SMS', 'description' => 'Enable or disable SMS notifications globally', 'is_mandatory' => false],
            ['key' => 'sms_provider', 'value' => 'none', 'type' => 'string', 'group' => 'sms', 'label' => 'SMS Provider', 'description' => 'SMS gateway provider (none, twilio, local)', 'is_mandatory' => false],
            ['key' => 'sms_api_key', 'value' => '', 'type' => 'string', 'group' => 'sms', 'label' => 'SMS API Key', 'description' => 'API key for SMS provider', 'is_mandatory' => false],
            ['key' => 'sms_sender_id', 'value' => '', 'type' => 'string', 'group' => 'sms', 'label' => 'SMS Sender ID', 'description' => 'Sender ID / FROM number for SMS', 'is_mandatory' => false],
            ['key' => 'sms_api_secret', 'value' => '', 'type' => 'string', 'group' => 'sms', 'label' => 'SMS API Secret', 'description' => 'API secret or auth token for SMS provider', 'is_mandatory' => false],

            // Email
            ['key' => 'email_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'email', 'label' => 'Enable Email', 'description' => 'Enable or disable email notifications globally', 'is_mandatory' => false],
            ['key' => 'email_provider', 'value' => 'smtp', 'type' => 'string', 'group' => 'email', 'label' => 'Email Provider', 'description' => 'Email provider (smtp, mailgun, ses)', 'is_mandatory' => false],
            ['key' => 'smtp_host', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Host', 'description' => 'SMTP server hostname', 'is_mandatory' => false],
            ['key' => 'smtp_port', 'value' => '587', 'type' => 'integer', 'group' => 'email', 'label' => 'SMTP Port', 'description' => 'SMTP server port (587 for TLS, 465 for SSL)', 'is_mandatory' => false],
            ['key' => 'smtp_user', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Username', 'description' => 'SMTP authentication username', 'is_mandatory' => false],
            ['key' => 'smtp_password', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Password', 'description' => 'SMTP authentication password', 'is_mandatory' => false],
            ['key' => 'from_email', 'value' => 'noreply@ekhata.pk', 'type' => 'string', 'group' => 'email', 'label' => 'From Email', 'description' => 'Default sender email address', 'is_mandatory' => false],
            ['key' => 'from_name', 'value' => 'e-Khata', 'type' => 'string', 'group' => 'email', 'label' => 'From Name', 'description' => 'Default sender name', 'is_mandatory' => false],

            // Notifications / Push
            ['key' => 'notifications_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'Enable Push Notifications', 'description' => 'Enable or disable push notifications globally', 'is_mandatory' => false],
            ['key' => 'push_provider', 'value' => 'firebase', 'type' => 'string', 'group' => 'notifications', 'label' => 'Push Provider', 'description' => 'Push notification provider (firebase, onesignal)', 'is_mandatory' => false],
            ['key' => 'firebase_server_key', 'value' => '', 'type' => 'string', 'group' => 'notifications', 'label' => 'Firebase Server Key', 'description' => 'Firebase Cloud Messaging server key', 'is_mandatory' => false],
            ['key' => 'in_app_notifications', 'value' => 'true', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'In-App Notifications', 'description' => 'Enable in-app notification bell', 'is_mandatory' => false],
        ];
    }
}
