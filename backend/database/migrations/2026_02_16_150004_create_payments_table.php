<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('party_id')->constrained()->cascadeOnDelete();
            $table->enum('gateway', ['jazzcash', 'easypaisa']);
            $table->enum('direction', ['inbound', 'outbound']);
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('PKR');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('gateway_txn_ref')->nullable();
            $table->json('gateway_response')->nullable();
            $table->string('pp_TxnRefNo')->nullable();
            $table->string('pp_ReturnURL')->nullable();
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('gateway_txn_ref');
            $table->index(['tenant_id', 'party_id', 'status']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
