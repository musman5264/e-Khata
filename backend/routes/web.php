<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Public shared ledger page
Route::get('/shared/{token}', [\App\Http\Controllers\SharedLedgerController::class, 'show'])
    ->name('shared.ledger');
