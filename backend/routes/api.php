<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\FirebaseAuthController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\PartyController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PaymentLinkController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ShareController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\LogController;
use App\Http\Controllers\Api\V1\SystemSettingsController;
use App\Http\Controllers\Api\V1\VersionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — e-Khata v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ──────────────────────────────────────────────────────
    // Public / Guest Routes
    // ──────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('firebase/verify', [FirebaseAuthController::class, 'verify']);
    });

    // Public version info
    Route::get('version/current', [VersionController::class, 'current']);

    // Payment gateway callbacks (public — no auth)
    Route::post('payments/jazzcash/callback', [PaymentController::class, 'jazzCashCallback']);
    Route::post('payments/easypaisa/callback', [PaymentController::class, 'easypaisaCallback']);
    Route::get('payments/jazzcash/return', [PaymentController::class, 'jazzCashReturn']);

    // Public payment link view (no auth)
    Route::get('pay/{token}', [PaymentLinkController::class, 'publicView']);

    // Team invitation accept (auth required but no tenant header needed)
    Route::post('team/invite/accept', [TeamController::class, 'acceptInvite'])
        ->middleware('auth:sanctum');

    // ──────────────────────────────────────────────────────
    // Authenticated Routes
    // ──────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'track.session'])->group(function () {

        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'changePassword']);

        // Tenants (no tenant context needed for listing / creating)
        Route::post('tenants', [TenantController::class, 'store']);
        Route::get('tenants', [TenantController::class, 'index']);

        // Sessions (user-level, no tenant context needed)
        Route::prefix('sessions')->group(function () {
            Route::get('/', [SessionController::class, 'index']);
            Route::get('current', [SessionController::class, 'current']);
            Route::delete('all-except-current', [SessionController::class, 'revokeAllExceptCurrent']);
            Route::delete('{id}', [SessionController::class, 'destroy']);
            Route::put('fcm-token', [SessionController::class, 'updateFcmToken']);
        });

        // Notifications (user-level)
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('unread-count', [NotificationController::class, 'unreadCount']);
            Route::put('read-all', [NotificationController::class, 'markAllAsRead']);
            Route::put('{id}/read', [NotificationController::class, 'markAsRead']);
            Route::delete('{id}', [NotificationController::class, 'destroy']);
            Route::get('preferences', [NotificationController::class, 'preferences']);
            Route::put('preferences', [NotificationController::class, 'updatePreferences']);
        });

        // ──────────────────────────────────────────────────────
        // Tenant-Scoped Routes (require X-Tenant-ID header)
        // ──────────────────────────────────────────────────────
        Route::middleware(['tenant', 'log.api'])->group(function () {

            // Tenants — update / delete
            Route::put('tenants/{id}', [TenantController::class, 'update']);
            Route::delete('tenants/{id}', [TenantController::class, 'destroy']);

            // Team
            Route::prefix('team')->group(function () {
                Route::get('members', [TeamController::class, 'members']);
                Route::post('invite', [TeamController::class, 'invite']);
                Route::put('members/{userId}/role', [TeamController::class, 'changeRole']);
                Route::delete('members/{userId}', [TeamController::class, 'removeMember']);
            });

            // Parties
            Route::get('parties/summary', [PartyController::class, 'summary']);
            Route::apiResource('parties', PartyController::class);

            // Transactions (nested under parties)
            Route::prefix('parties/{partyId}')->group(function () {
                Route::apiResource('transactions', TransactionController::class);

                // Payments — collect & send per party
                Route::post('payments/collect', [PaymentController::class, 'collect']);
                Route::post('payments/send', [PaymentController::class, 'send']);

                // Payment links — generate shareable payment links per party
                Route::post('payment-links', [PaymentLinkController::class, 'store']);

                // Sharing & export
                Route::get('statement/pdf', [ShareController::class, 'pdf']);
                Route::post('statement/share', [ShareController::class, 'share']);
                Route::post('statement/email', [ShareController::class, 'email']);
                Route::post('statement/whatsapp', [ShareController::class, 'whatsapp']);
            });

            // Payments — history & detail
            Route::get('payments', [PaymentController::class, 'index']);
            Route::get('payments/{id}', [PaymentController::class, 'show']);

            // Payment links — list, detail, cancel, share
            Route::get('payment-links', [PaymentLinkController::class, 'index']);
            Route::get('payment-links/{id}', [PaymentLinkController::class, 'show']);
            Route::put('payment-links/{id}/cancel', [PaymentLinkController::class, 'cancel']);
            Route::get('payment-links/{id}/share', [PaymentLinkController::class, 'share']);

            // Flat transaction routes (convenience — no party prefix needed)
            Route::get('transactions/{id}', [TransactionController::class, 'showFlat']);
            Route::put('transactions/{id}', [TransactionController::class, 'updateFlat']);
            Route::delete('transactions/{id}', [TransactionController::class, 'destroyFlat']);

            // Reports
            Route::prefix('reports')->group(function () {
                Route::get('dashboard', [ReportController::class, 'dashboard']);
                Route::get('daybook', [ReportController::class, 'daybook']);
                Route::get('trial-balance', [ReportController::class, 'trialBalance']);
                Route::get('party-ledger/{partyId}', [ReportController::class, 'partyLedger']);
                Route::get('party-statement/{partyId}', [ReportController::class, 'partyStatement']);
                Route::get('cash-flow', [ReportController::class, 'cashFlow']);
                Route::get('payment-summary', [ReportController::class, 'paymentSummary']);
                Route::get('receivable-aging', [ReportController::class, 'receivableAging']);
                Route::get('payable-aging', [ReportController::class, 'payableAging']);
            });

            // Logs (Owner only — permission checked in controller)
            Route::prefix('logs')->group(function () {
                Route::get('activity', [LogController::class, 'activity']);
                Route::get('activity/export', [LogController::class, 'exportActivity']);
                Route::get('system', [LogController::class, 'system']);
                Route::get('access', [LogController::class, 'access']);
            });
        });

        // ──────────────────────────────────────────────────────
        // Super Admin Routes (no tenant context needed)
        // ──────────────────────────────────────────────────────
        Route::prefix('admin')->group(function () {
            Route::get('dashboard', [SystemSettingsController::class, 'dashboard']);
            Route::get('settings', [SystemSettingsController::class, 'index']);
            Route::put('settings', [SystemSettingsController::class, 'update']);
            Route::get('settings/{key}', [SystemSettingsController::class, 'show']);

            // Admin Reports
            Route::get('reports/users', [SystemSettingsController::class, 'userReport']);
            Route::get('reports/businesses', [SystemSettingsController::class, 'businessReport']);
            Route::get('reports/activity', [SystemSettingsController::class, 'activityReport']);

            // User management
            Route::get('users', [SystemSettingsController::class, 'users']);
            Route::get('users/{id}', [SystemSettingsController::class, 'showUser']);
            Route::put('users/{id}', [SystemSettingsController::class, 'updateUser']);
            Route::delete('users/{id}', [SystemSettingsController::class, 'deleteUser']);
            Route::put('users/{id}/toggle-active', [SystemSettingsController::class, 'toggleUserActive']);

            // Tenant/Business management
            Route::get('tenants', [SystemSettingsController::class, 'tenants']);
            Route::get('tenants/{id}', [SystemSettingsController::class, 'showTenant']);
            Route::put('tenants/{id}', [SystemSettingsController::class, 'updateTenant']);
            Route::delete('tenants/{id}', [SystemSettingsController::class, 'deleteTenant']);

            // Version management
            Route::get('versions', [VersionController::class, 'index']);
            Route::post('versions', [VersionController::class, 'store']);
            Route::get('versions/{id}', [VersionController::class, 'show']);
            Route::put('versions/{id}', [VersionController::class, 'update']);
            Route::delete('versions/{id}', [VersionController::class, 'destroy']);

            // Admin Session management (Super Admin only)
            Route::get('sessions', [SessionController::class, 'adminIndex']);
            Route::post('sessions/cleanup', [SessionController::class, 'cleanupDuplicates']);
            Route::get('sessions/{id}', [SessionController::class, 'adminShow']);
            Route::get('sessions/{id}/activities', [SessionController::class, 'sessionActivities']);
            Route::delete('sessions/{id}', [SessionController::class, 'adminDestroy']);
        });
    });
});
