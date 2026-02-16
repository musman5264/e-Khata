<?php

namespace App\Providers;

use App\Events\LedgerShared;
use App\Events\NewDeviceLogin;
use App\Events\PaymentReceived;
use App\Events\PaymentSent;
use App\Events\TeamMemberJoined;
use App\Events\TransactionCreated;
use App\Events\TransactionDeleted;
use App\Events\TransactionEdited;
use App\Listeners\CreateLedgerEntryOnPayment;
use App\Listeners\DetectSuspiciousActivity;
use App\Listeners\LogActivity;
use App\Listeners\SendNewDeviceAlert;
use App\Listeners\SendPaymentNotification;
use App\Listeners\SendTransactionNotification;
use App\Models\Party;
use App\Models\Transaction;
use App\Observers\PartyObserver;
use App\Observers\TransactionObserver;
use App\Services\FirebaseMessagingService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Kreait\Firebase\Contract\Messaging;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register FirebaseMessagingService with graceful fallback
        $this->app->singleton(FirebaseMessagingService::class, function ($app) {
            try {
                $messaging = $app->make(Messaging::class);
                return new FirebaseMessagingService($messaging);
            } catch (\Throwable $e) {
                return new FirebaseMessagingService(null);
            }
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ── Gate: map authorize() calls to Spatie permissions ─
        Gate::before(function ($user, $ability) {
            if ($user->hasPermissionTo($ability)) {
                return true;
            }
        });
        // ── Observers ────────────────────────────────────────
        Transaction::observe(TransactionObserver::class);
        Party::observe(PartyObserver::class);

        // ── Event → Listener Mapping ─────────────────────────
        Event::listen(TransactionCreated::class, [SendTransactionNotification::class, 'handle']);
        Event::listen(TransactionCreated::class, [LogActivity::class, 'handle']);

        Event::listen(TransactionEdited::class, [SendTransactionNotification::class, 'handle']);
        Event::listen(TransactionEdited::class, [LogActivity::class, 'handle']);

        Event::listen(TransactionDeleted::class, [SendTransactionNotification::class, 'handle']);
        Event::listen(TransactionDeleted::class, [LogActivity::class, 'handle']);

        Event::listen(PaymentReceived::class, [CreateLedgerEntryOnPayment::class, 'handlePaymentReceived']);
        Event::listen(PaymentReceived::class, [SendPaymentNotification::class, 'handlePaymentReceived']);
        Event::listen(PaymentReceived::class, [LogActivity::class, 'handle']);

        Event::listen(PaymentSent::class, [CreateLedgerEntryOnPayment::class, 'handlePaymentSent']);
        Event::listen(PaymentSent::class, [SendPaymentNotification::class, 'handlePaymentSent']);
        Event::listen(PaymentSent::class, [LogActivity::class, 'handle']);

        Event::listen(NewDeviceLogin::class, [SendNewDeviceAlert::class, 'handle']);
        Event::listen(NewDeviceLogin::class, [DetectSuspiciousActivity::class, 'handle']);

        Event::listen(LedgerShared::class, [LogActivity::class, 'handle']);

        Event::listen(TeamMemberJoined::class, [LogActivity::class, 'handle']);
    }
}
