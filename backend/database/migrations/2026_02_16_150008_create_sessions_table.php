<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('token_id')->nullable();
            $table->string('device_id')->nullable();
            $table->string('device_name')->nullable();
            $table->string('device_model')->nullable();
            $table->string('device_brand')->nullable();
            $table->string('os_name')->nullable();
            $table->string('os_version')->nullable();
            $table->string('app_version')->nullable();
            $table->string('browser_name')->nullable();
            $table->string('browser_version')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('last_ip_address', 45)->nullable();
            $table->string('geo_country')->nullable();
            $table->string('geo_city')->nullable();
            $table->decimal('geo_lat', 10, 7)->nullable();
            $table->decimal('geo_lng', 10, 7)->nullable();
            $table->text('fcm_token')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_active_at')->nullable();
            $table->timestamp('login_at')->nullable();
            $table->timestamp('logout_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index('device_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
