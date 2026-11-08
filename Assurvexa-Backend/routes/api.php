<?php

use Illuminate\Support\Facades\Route;

// Controllers :
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\ReimbursementController;


// Unprotected Routes :
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/policies', [PolicyController::class, 'index']);
Route::get('/policies/{policy}', [PolicyController::class, 'show']);


// Protected Routes :
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Admin Routes
    Route::middleware('admin')->group(function () {
        // Customers
        Route::apiResource('customers', CustomerController::class);

        // Policies
        Route::apiResource('policies', PolicyController::class)->except(['index', 'show']);

        // Agents
        Route::apiResource('agents', AgentController::class);

        // Reimbursements
        Route::apiResource('reimbursements', ReimbursementController::class);

        // Claims
        Route::apiResource('claims', ClaimController::class);

        // Contracts
        Route::apiResource('contracts', ContractController::class);
    });

    // Agent Routes
    Route::middleware('agent')->group(function () {
        // Contracts
        Route::get('/contracts', [ContractController::class, 'index']);
        Route::post('/contracts', [ContractController::class, 'store']);
        Route::get('/contracts/{contract}', [ContractController::class, 'show']);
        Route::put('/contracts/{contract}', [ContractController::class, 'update']);


        // View customers
        Route::get('/customers', [CustomerController::class, 'indexForAgent']);
        Route::get('/customers/{customer}', [CustomerController::class, 'showForAgent']);

        // Claims update
        Route::get('/claims', [ClaimController::class, 'index']);
        Route::get('/claims/{claim}', [ClaimController::class, 'show']);
        Route::put('/claims/{claim}', [ClaimController::class, 'update']);

        // Reimbursements
        Route::get('/reimbursements', [ReimbursementController::class, 'index']);
        Route::post('/reimbursements', [ReimbursementController::class, 'store']);
        Route::get('/reimbursements/{reimbursement}', [ReimbursementController::class, 'show']);
        Route::put('/reimbursements/{reimbursement}', [ReimbursementController::class, 'update']);
    });

    // Customer Routes
    Route::middleware('customer')->group(function () {
        // Own profile
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);

        // Own contracts
        Route::get('/contracts', [ContractController::class, 'index']);
        Route::get('/contracts/{contract}', [ContractController::class, 'show']);

        // Claims
        Route::get('/claims', [ClaimController::class, 'index']);
        Route::post('/claims', [ClaimController::class, 'store']);
        Route::get('/claims/{claim}', [ClaimController::class, 'show']);

        // Own reimbursements
        Route::get('/reimbursements', [ReimbursementController::class, 'index']);
        Route::get('/reimbursements/{reimbursement}', [ReimbursementController::class, 'show']);
    });
});
