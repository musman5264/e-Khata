<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->string('photo_url')->nullable()->after('name');
            $table->string('bill_book_name')->nullable()->after('book_number');
            $table->string('bill_book_number')->nullable()->after('bill_book_name');
            $table->string('page_number')->nullable()->after('bill_book_number');
        });
    }

    public function down(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->dropColumn(['photo_url', 'bill_book_name', 'bill_book_number', 'page_number']);
        });
    }
};
