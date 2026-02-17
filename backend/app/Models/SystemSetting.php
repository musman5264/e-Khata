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

            // ── Third-party Integrations: Google ──
            ['key' => 'google_signin_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'integrations_google', 'label' => 'Enable Google Sign-In', 'description' => 'Allow users to sign in with Google. Configure at https://console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs', 'is_mandatory' => false],
            ['key' => 'google_client_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_google', 'label' => 'Google Client ID', 'description' => 'OAuth 2.0 Client ID from Google Cloud Console (e.g. 123456.apps.googleusercontent.com)', 'is_mandatory' => false],
            ['key' => 'google_client_secret', 'value' => '', 'type' => 'string', 'group' => 'integrations_google', 'label' => 'Google Client Secret', 'description' => 'OAuth 2.0 Client Secret from Google Cloud Console', 'is_mandatory' => false],
            ['key' => 'google_analytics_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_google', 'label' => 'Google Analytics ID', 'description' => 'Google Analytics Measurement ID (e.g. G-XXXXXXXXXX). Configure at https://analytics.google.com', 'is_mandatory' => false],
            ['key' => 'google_maps_api_key', 'value' => '', 'type' => 'string', 'group' => 'integrations_google', 'label' => 'Google Maps API Key', 'description' => 'API key for Google Maps. Configure at https://console.cloud.google.com → APIs & Services → Credentials', 'is_mandatory' => false],

            // ── Third-party Integrations: Meta/Facebook ──
            ['key' => 'meta_signin_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'integrations_meta', 'label' => 'Enable Meta/Facebook Sign-In', 'description' => 'Allow users to sign in with Facebook/Meta. Configure at https://developers.facebook.com → My Apps → Create App → Facebook Login', 'is_mandatory' => false],
            ['key' => 'meta_app_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_meta', 'label' => 'Meta App ID', 'description' => 'App ID from Meta for Developers dashboard (https://developers.facebook.com/apps)', 'is_mandatory' => false],
            ['key' => 'meta_app_secret', 'value' => '', 'type' => 'string', 'group' => 'integrations_meta', 'label' => 'Meta App Secret', 'description' => 'App Secret from Meta for Developers → Settings → Basic', 'is_mandatory' => false],
            ['key' => 'meta_pixel_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_meta', 'label' => 'Meta Pixel ID', 'description' => 'Facebook Pixel ID for tracking. Configure at https://business.facebook.com → Events Manager → Pixels', 'is_mandatory' => false],
            ['key' => 'whatsapp_business_token', 'value' => '', 'type' => 'string', 'group' => 'integrations_meta', 'label' => 'WhatsApp Business API Token', 'description' => 'Permanent token from Meta Business → WhatsApp → API Setup. Required for sending WhatsApp messages.', 'is_mandatory' => false],
            ['key' => 'whatsapp_phone_number_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_meta', 'label' => 'WhatsApp Phone Number ID', 'description' => 'Phone Number ID from Meta Business → WhatsApp → Getting Started', 'is_mandatory' => false],

            // ── Third-party Integrations: Apple ──
            ['key' => 'apple_signin_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'integrations_apple', 'label' => 'Enable Apple Sign-In', 'description' => 'Allow users to sign in with Apple. Configure at https://developer.apple.com → Certificates, IDs & Profiles → Service IDs', 'is_mandatory' => false],
            ['key' => 'apple_client_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_apple', 'label' => 'Apple Service ID', 'description' => 'Service ID from Apple Developer Portal → Identifiers → Service IDs', 'is_mandatory' => false],
            ['key' => 'apple_team_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_apple', 'label' => 'Apple Team ID', 'description' => 'Team ID from Apple Developer Portal → Membership → Team ID', 'is_mandatory' => false],
            ['key' => 'apple_key_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_apple', 'label' => 'Apple Key ID', 'description' => 'Key ID from Apple Developer Portal → Keys → Sign in with Apple', 'is_mandatory' => false],
            ['key' => 'apple_private_key', 'value' => '', 'type' => 'string', 'group' => 'integrations_apple', 'label' => 'Apple Private Key', 'description' => 'Contents of the .p8 key file downloaded from Apple Developer Portal → Keys', 'is_mandatory' => false],

            // ── Third-party Integrations: Microsoft ──
            ['key' => 'microsoft_signin_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'integrations_microsoft', 'label' => 'Enable Microsoft Sign-In', 'description' => 'Allow users to sign in with Microsoft/Windows. Configure at https://portal.azure.com → Azure Active Directory → App Registrations', 'is_mandatory' => false],
            ['key' => 'microsoft_client_id', 'value' => '', 'type' => 'string', 'group' => 'integrations_microsoft', 'label' => 'Microsoft Client ID', 'description' => 'Application (client) ID from Azure Portal → App Registrations → Overview', 'is_mandatory' => false],
            ['key' => 'microsoft_client_secret', 'value' => '', 'type' => 'string', 'group' => 'integrations_microsoft', 'label' => 'Microsoft Client Secret', 'description' => 'Client secret from Azure Portal → App Registrations → Certificates & Secrets → New Client Secret', 'is_mandatory' => false],
            ['key' => 'microsoft_tenant_id', 'value' => 'common', 'type' => 'string', 'group' => 'integrations_microsoft', 'label' => 'Microsoft Tenant ID', 'description' => 'Directory (tenant) ID, or "common" for multi-tenant. Found in Azure Portal → App Registrations → Overview', 'is_mandatory' => false],

            // ── WhatsApp Business API (via Meta) ──
            ['key' => 'whatsapp_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'whatsapp', 'label' => 'Enable WhatsApp Messaging', 'description' => 'Enable WhatsApp Business API to send transaction alerts, payment reminders, and ledger summaries via WhatsApp.', 'is_mandatory' => false],
            ['key' => 'whatsapp_provider', 'value' => 'meta', 'type' => 'string', 'group' => 'whatsapp', 'label' => 'WhatsApp Provider', 'description' => 'Choose your WhatsApp API provider', 'is_mandatory' => false],
            ['key' => 'whatsapp_api_token', 'value' => '', 'type' => 'string', 'group' => 'whatsapp', 'label' => 'WhatsApp API Token', 'description' => 'Permanent token from Meta Business Suite → WhatsApp → API Setup → Generate Token. Or your provider\'s API key.', 'is_mandatory' => false],
            ['key' => 'whatsapp_phone_id', 'value' => '', 'type' => 'string', 'group' => 'whatsapp', 'label' => 'WhatsApp Phone Number ID', 'description' => 'Phone Number ID from Meta Business → WhatsApp → Getting Started. Displayed next to your connected phone number.', 'is_mandatory' => false],
            ['key' => 'whatsapp_business_id', 'value' => '', 'type' => 'string', 'group' => 'whatsapp', 'label' => 'WhatsApp Business Account ID', 'description' => 'WABA ID from Meta Business Suite → WhatsApp → Settings → WhatsApp Business Account ID', 'is_mandatory' => false],
            ['key' => 'whatsapp_webhook_secret', 'value' => '', 'type' => 'string', 'group' => 'whatsapp', 'label' => 'Webhook Verify Token', 'description' => 'Custom token for webhook URL verification. Set same value in Meta Dashboard → Webhooks → Verify Token.', 'is_mandatory' => false],
            ['key' => 'whatsapp_template_namespace', 'value' => '', 'type' => 'string', 'group' => 'whatsapp', 'label' => 'Message Template Namespace', 'description' => 'Namespace for approved WhatsApp message templates. Found in WhatsApp Manager → Message Templates.', 'is_mandatory' => false],

            // ── WhatsApp Direct (wa.me / Click-to-Chat) ──
            ['key' => 'whatsapp_direct_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'whatsapp_direct', 'label' => 'Enable WhatsApp Direct Links', 'description' => 'Enable wa.me direct chat links for customers and support. No API required — uses standard WhatsApp deep links.', 'is_mandatory' => false],
            ['key' => 'whatsapp_direct_number', 'value' => '', 'type' => 'string', 'group' => 'whatsapp_direct', 'label' => 'Business WhatsApp Number', 'description' => 'Your business WhatsApp number in international format (e.g. 923001234567). Used for wa.me links and chat buttons.', 'is_mandatory' => false],
            ['key' => 'whatsapp_direct_message', 'value' => 'Hi, I would like to inquire about my account.', 'type' => 'string', 'group' => 'whatsapp_direct', 'label' => 'Default Message Template', 'description' => 'Pre-filled message when customers click the WhatsApp chat button. Supports {name}, {mobile}, {balance} placeholders.', 'is_mandatory' => false],
            ['key' => 'whatsapp_direct_support_number', 'value' => '', 'type' => 'string', 'group' => 'whatsapp_direct', 'label' => 'Support WhatsApp Number', 'description' => 'Dedicated support WhatsApp number (if different from business number). Shown on support/help pages.', 'is_mandatory' => false],
            ['key' => 'whatsapp_direct_show_on_ledger', 'value' => 'true', 'type' => 'boolean', 'group' => 'whatsapp_direct', 'label' => 'Show on Ledger Screen', 'description' => 'Display a WhatsApp chat button on party ledger screens for quick communication.', 'is_mandatory' => false],
            ['key' => 'whatsapp_direct_share_ledger', 'value' => 'true', 'type' => 'boolean', 'group' => 'whatsapp_direct', 'label' => 'Enable Share Ledger via WhatsApp', 'description' => 'Allow sharing ledger summary and transaction details via WhatsApp to the party.', 'is_mandatory' => false],

            // ── Firebase / Google Project Integration ──
            ['key' => 'firebase_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'firebase', 'label' => 'Enable Firebase Integration', 'description' => 'Enable Firebase services for push notifications, analytics, crash reporting, and remote config.', 'is_mandatory' => false],
            ['key' => 'firebase_project_id', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Firebase Project ID', 'description' => 'Project ID from Firebase Console → Project Settings → General (e.g. my-app-12345)', 'is_mandatory' => false],
            ['key' => 'firebase_web_api_key', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Web API Key', 'description' => 'Web API Key from Firebase Console → Project Settings → General → Your apps → Web app', 'is_mandatory' => false],
            ['key' => 'firebase_auth_domain', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Auth Domain', 'description' => 'Auth domain (e.g. my-app-12345.firebaseapp.com). Found in Firebase Console → Authentication → Settings', 'is_mandatory' => false],
            ['key' => 'firebase_storage_bucket', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Storage Bucket', 'description' => 'Cloud Storage bucket (e.g. my-app-12345.appspot.com). Found in Firebase Console → Storage', 'is_mandatory' => false],
            ['key' => 'firebase_messaging_sender_id', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Messaging Sender ID', 'description' => 'Cloud Messaging Sender ID. Firebase Console → Project Settings → Cloud Messaging', 'is_mandatory' => false],
            ['key' => 'firebase_app_id', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Firebase App ID', 'description' => 'App ID from Firebase Console → Project Settings → General → Your apps (e.g. 1:123456789:web:abc123)', 'is_mandatory' => false],
            ['key' => 'firebase_measurement_id', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Measurement ID', 'description' => 'Google Analytics Measurement ID linked to Firebase (e.g. G-XXXXXXXXXX). Found in Firebase Console → Analytics', 'is_mandatory' => false],
            ['key' => 'firebase_service_account_json', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Service Account JSON', 'description' => 'Service Account key JSON content. Generate at Firebase Console → Project Settings → Service accounts → Generate new private key', 'is_mandatory' => false],
            ['key' => 'firebase_crashlytics_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'firebase', 'label' => 'Enable Crashlytics', 'description' => 'Enable Firebase Crashlytics for crash reporting and error tracking.', 'is_mandatory' => false],
            ['key' => 'firebase_analytics_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'firebase', 'label' => 'Enable Analytics', 'description' => 'Enable Firebase Analytics for user behavior tracking and custom events.', 'is_mandatory' => false],
            ['key' => 'firebase_remote_config_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'firebase', 'label' => 'Enable Remote Config', 'description' => 'Enable Firebase Remote Config for dynamic app configuration without app updates.', 'is_mandatory' => false],
            ['key' => 'firebase_dynamic_links_domain', 'value' => '', 'type' => 'string', 'group' => 'firebase', 'label' => 'Dynamic Links Domain', 'description' => 'Firebase Dynamic Links domain (e.g. myapp.page.link). Configure at Firebase Console → Dynamic Links', 'is_mandatory' => false],

            // ── Google Cloud Services ──
            ['key' => 'google_cloud_project_id', 'value' => '', 'type' => 'string', 'group' => 'google_cloud', 'label' => 'Google Cloud Project ID', 'description' => 'GCP Project ID from https://console.cloud.google.com → Select project → Dashboard', 'is_mandatory' => false],
            ['key' => 'google_cloud_service_account', 'value' => '', 'type' => 'string', 'group' => 'google_cloud', 'label' => 'Service Account Email', 'description' => 'GCP Service Account email (e.g. my-account@project.iam.gserviceaccount.com). Create at IAM & Admin → Service Accounts', 'is_mandatory' => false],
            ['key' => 'google_recaptcha_site_key', 'value' => '', 'type' => 'string', 'group' => 'google_cloud', 'label' => 'reCAPTCHA Site Key', 'description' => 'reCAPTCHA v3 site key from https://www.google.com/recaptcha/admin', 'is_mandatory' => false],
            ['key' => 'google_recaptcha_secret_key', 'value' => '', 'type' => 'string', 'group' => 'google_cloud', 'label' => 'reCAPTCHA Secret Key', 'description' => 'reCAPTCHA v3 secret key for server-side validation', 'is_mandatory' => false],
            ['key' => 'google_translate_api_key', 'value' => '', 'type' => 'string', 'group' => 'google_cloud', 'label' => 'Cloud Translation API Key', 'description' => 'API key for Google Cloud Translation. Enable at GCP Console → APIs & Services → Cloud Translation API', 'is_mandatory' => false],
        ];
    }
}
