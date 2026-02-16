<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('session_id')->nullable();
            $table->string('method', 10);
            $table->text('url');
            $table->string('route_name')->nullable();
            $table->json('request_headers')->nullable();
            $table->json('request_body')->nullable();
            $table->smallInteger('response_status')->nullable();
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['tenant_id', 'created_at']);
            $table->index('response_status');

            $table->foreign('session_id')->references('id')->on('sessions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_logs');
    }
};
