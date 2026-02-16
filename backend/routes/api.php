<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\FirebaseAuthController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\PartyController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ShareController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\LogController;
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

    // Payment gateway callbacks (public — no auth)
    Route::post('payments/jazzcash/callback', [PaymentController::class, 'jazzCashCallback']);
    Route::post('payments/easypaisa/callback', [PaymentController::class, 'easypaisaCallback']);
    Route::get('payments/jazzcash/return', [PaymentController::class, 'jazzCashReturn']);

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

                // Sharing & export
                Route::get('statement/pdf', [ShareController::class, 'pdf']);
                Route::post('statement/share', [ShareController::class, 'share']);
                Route::post('statement/email', [ShareController::class, 'email']);
                Route::post('statement/whatsapp', [ShareController::class, 'whatsapp']);
            });

            // Payments — history & detail
            Route::get('payments', [PaymentController::class, 'index']);
            Route::get('payments/{id}', [PaymentController::class, 'show']);

            // Reports
            Route::prefix('reports')->group(function () {
                Route::get('dashboard', [ReportController::class, 'dashboard']);
                Route::get('daybook', [ReportController::class, 'daybook']);
                Route::get('trial-balance', [ReportController::class, 'trialBalance']);
            });

            // Logs (Owner only — permission checked in controller)
            Route::prefix('logs')->group(function () {
                Route::get('activity', [LogController::class, 'activity']);
                Route::get('activity/export', [LogController::class, 'exportActivity']);
                Route::get('system', [LogController::class, 'system']);
                Route::get('access', [LogController::class, 'access']);
            });
        });
    });
});
