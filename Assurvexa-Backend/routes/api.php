<?php

use App\Http\Controllers\Api\AgentController;
// Controllers :
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\ReimbursementController;
use Illuminate\Support\Facades\Route;

// Unprotected Routes :
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

Route::get('/policies', [PolicyController::class, 'index']);
Route::get('/policies/{policy}', [PolicyController::class, 'show']);

// Protected Routes :
Route::middleware('auth.cookie')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Authenticated users can view only the contracts, claims, and
    // reimbursements allowed by their role and ownership.
    Route::get('/claims', [ClaimController::class, 'index']);
    Route::get('/claims/{claim}', [ClaimController::class, 'show']);
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::put('/claims/{claim}', [ClaimController::class, 'update']);
    Route::get('/contracts', [ContractController::class, 'index']);
    Route::get('/contracts/{contract}', [ContractController::class, 'show']);
    Route::post('/contracts', [ContractController::class, 'store']);
    Route::put('/contracts/{contract}', [ContractController::class, 'update']);
    Route::get('/reimbursements', [ReimbursementController::class, 'index']);
    Route::get('/reimbursements/{reimbursement}', [ReimbursementController::class, 'show']);
    Route::post('/reimbursements', [ReimbursementController::class, 'store']);
    Route::put('/reimbursements/{reimbursement}', [ReimbursementController::class, 'update']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);

    // Admin Routes
    Route::middleware('admin')->group(function () {
        Route::apiResource('customers', CustomerController::class)->except(['show', 'update']);
        Route::apiResource('policies', PolicyController::class)->except(['index', 'show']);
        Route::apiResource('agents', AgentController::class);
        Route::apiResource('claims', ClaimController::class)
            ->except(['index', 'show', 'store', 'update']);
        Route::apiResource('contracts', ContractController::class)
            ->except(['index', 'show', 'store', 'update']);
        Route::apiResource('reimbursements', ReimbursementController::class)
            ->except(['index', 'show', 'store', 'update']);
    });

    // Agent Routes
    Route::middleware('agent')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
    });

});
