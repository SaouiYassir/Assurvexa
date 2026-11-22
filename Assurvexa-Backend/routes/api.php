<?php

use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\ReimbursementController;
use Illuminate\Support\Facades\Route;

// ==========================================
// PUBLIC ROUTES
// ==========================================

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');


// ==========================================
// AUTHENTICATED ROUTES
// ==========================================

Route::middleware('auth.cookie')->group(function () {

    // Authentication
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateMe']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Shared dashboard
    Route::get('/dashboard/statistics', [
        DashboardController::class,
        'statistics'
    ]);

    // Shared read-only resources
    Route::get('/policies', [PolicyController::class, 'index']);
    Route::get('/policies/{policy}', [PolicyController::class, 'show']);

    Route::get('/claims', [ClaimController::class, 'index']);
    Route::get('/claims/{claim}', [ClaimController::class, 'show']);
    Route::put('/claims/{claim}', [ClaimController::class, 'update']);

    Route::get('/contracts', [ContractController::class, 'index']);
    Route::get('/contracts/{contract}', [ContractController::class, 'show']);

    Route::get('/reimbursements', [ReimbursementController::class, 'index']);
    Route::get('/reimbursements/{reimbursement}', [
        ReimbursementController::class,
        'show'
    ]);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);


    // ======================================
    // ADMIN ROUTES
    // ======================================

    Route::middleware('admin')->group(function () {

        // Policies
        Route::post('/policies', [PolicyController::class, 'store']);
        Route::put('/policies/{policy}', [PolicyController::class, 'update']);
        Route::delete('/policies/{policy}', [PolicyController::class, 'destroy']);

        // Agents
        Route::apiResource('agents', AgentController::class);
    });


    // ======================================
    // AGENT ROUTES
    // ======================================

    Route::middleware('agent')->group(function () {

        // Claims
        // Route::put('/claims/{claim}', [ClaimController::class, 'update']);
        Route::delete('/claims/{claim}', [ClaimController::class, 'destroy']);

        // Contracts
        Route::post('/contracts', [ContractController::class, 'store']);
        Route::put('/contracts/{contract}', [ContractController::class, 'update']);
        Route::delete('/contracts/{contract}', [ContractController::class, 'destroy']);

        // Reimbursements
        Route::post('/reimbursements', [ReimbursementController::class, 'store']);
        Route::put('/reimbursements/{reimbursement}', [
            ReimbursementController::class,
            'update'
        ]);
        Route::delete('/reimbursements/{reimbursement}', [
            ReimbursementController::class,
            'destroy'
        ]);
    });


    // ======================================
    // CUSTOMER ROUTES
    // ======================================

    Route::middleware('customer')->group(function () {

        // Claims
        Route::post('/claims', [ClaimController::class, 'store']);
    });

});
