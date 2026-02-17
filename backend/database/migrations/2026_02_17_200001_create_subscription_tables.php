<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Subscription Plans (managed by Super Admin)
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');                     // e.g. "Basic Monthly", "Pro Yearly"
            $table->string('slug')->unique();           // e.g. "basic-monthly"
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);            // Price in PKR
            $table->enum('billing_cycle', ['monthly', 'yearly']);
            $table->integer('duration_days');            // 30 for monthly, 365 for yearly
            $table->integer('max_parties')->default(0);        // 0 = unlimited
            $table->integer('max_users')->default(0);          // 0 = unlimited
            $table->integer('max_transactions')->default(0);   // 0 = unlimited per month
            $table->boolean('has_reports')->default(true);
            $table->boolean('has_payment_links')->default(true);
            $table->boolean('has_sms')->default(false);
            $table->boolean('has_whatsapp')->default(false);
            $table->json('features')->nullable();       // Extra features JSON
            $table->integer('trial_days')->default(0);  // Free trial period
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Subscriptions — links a Tenant to a Plan
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('subscription_plans')->onDelete('restrict');
            $table->enum('status', ['trial', 'active', 'expired', 'cancelled', 'suspended'])->default('trial');
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index('ends_at');
        });

        // Subscription Payments — tracks payments for subscriptions
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('subscription_plans')->onDelete('restrict');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // who paid
            $table->decimal('amount', 10, 2);
            $table->enum('gateway', ['jazzcash', 'easypaisa', 'manual']);
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('gateway_transaction_id')->nullable();
            $table->string('gateway_reference')->nullable();
            $table->json('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index('gateway_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');
    }
};
