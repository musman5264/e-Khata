<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | JazzCash Payment Gateway
    |--------------------------------------------------------------------------
    */
    'jazzcash' => [
        'merchant_id' => env('JAZZCASH_MERCHANT_ID'),
        'password' => env('JAZZCASH_PASSWORD'),
        'integrity_salt' => env('JAZZCASH_INTEGRITY_SALT'),
        'return_url' => env('JAZZCASH_RETURN_URL'),
        'sandbox' => env('JAZZCASH_SANDBOX', true),
        'sandbox_url' => 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction',
        'live_url' => 'https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction',
    ],

    /*
    |--------------------------------------------------------------------------
    | EasyPaisa Payment Gateway
    |--------------------------------------------------------------------------
    */
    'easypaisa' => [
        'store_id' => env('EASYPAISA_STORE_ID'),
        'username' => env('EASYPAISA_USERNAME'),
        'password' => env('EASYPAISA_PASSWORD'),
        'sandbox' => env('EASYPAISA_SANDBOX', true),
        'sandbox_url' => 'https://easypaystg.easypaisa.com.pk/easypay-service/rest/v4',
        'live_url' => 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4',
    ],

    /*
    |--------------------------------------------------------------------------
    | Google OAuth (via Socialite)
    |--------------------------------------------------------------------------
    */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Facebook OAuth (via Socialite)
    |--------------------------------------------------------------------------
    */
    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('FACEBOOK_REDIRECT_URL'),
    ],

];
