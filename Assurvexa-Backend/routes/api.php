<?php

use Illuminate\Support\Facades\Route;

// Controllers :
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\ContractController;


// Unprotected Routes :
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


// Protected Routes :
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Admin Routes
    Route::middleware('admin')->group(function () {
        // Customers
        Route::apiResource('customers', CustomerController::class);

        // Policies
        Route::apiResource('policies', PolicyController::class);

        // Agents
        Route::apiResource('agents', AgentController::class);

    });

    // Agent Routes
    Route::middleware('agent')->group(function () {
        Route::apiResource('contracts', ContractController::class);
    });
});
