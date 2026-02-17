<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_versions', function (Blueprint $table) {
            $table->id();
            $table->string('version', 20);           // e.g. 1.0.0, 1.1.0
            $table->string('title');                   // e.g. "Initial Release"
            $table->text('changelog');                 // Markdown/HTML changelog
            $table->enum('channel', ['stable', 'beta', 'alpha'])->default('stable');
            $table->enum('platform', ['all', 'web', 'ios', 'android'])->default('all');
            $table->boolean('is_current')->default(false);
            $table->boolean('force_update')->default(false); // Force users to update
            $table->date('release_date');
            $table->unsignedBigInteger('released_by')->nullable();
            $table->timestamps();

            $table->foreign('released_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['version', 'platform']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_versions');
    }
};
