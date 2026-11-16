<?php

use App\Http\Controllers\Api\AgentController;
// Controllers :
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
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

    // Customers, agents, and administrators use the same resource URLs.
    // Controllers enforce the permission matrix for each operation.
    Route::get('/claims', [ClaimController::class, 'index']);
    Route::get('/claims/{claim}', [ClaimController::class, 'show']);
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::put('/claims/{claim}', [ClaimController::class, 'update']);
    Route::get('/contracts', [ContractController::class, 'index']);
    Route::get('/contracts/{contract}', [ContractController::class, 'show']);
    Route::post('/contracts', [ContractController::class, 'store']);
    Route::put('/contracts/{contract}', [ContractController::class, 'update']);
    Route::delete('/contracts/{contract}', [ContractController::class, 'destroy']);
    Route::get('/reimbursements', [ReimbursementController::class, 'index']);
    Route::get('/reimbursements/{reimbursement}', [ReimbursementController::class, 'show']);
    Route::post('/reimbursements', [ReimbursementController::class, 'store']);
    Route::put('/reimbursements/{reimbursement}', [ReimbursementController::class, 'update']);
    Route::delete('/reimbursements/{reimbursement}', [ReimbursementController::class, 'destroy']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

    // Admin Routes
    Route::middleware('admin')->group(function () {
        Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
        Route::apiResource('policies', PolicyController::class)->except(['index', 'show']);
        Route::apiResource('agents', AgentController::class);
    });
});
