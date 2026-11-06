<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use App\Http\Resources\UserResource;

class CustomerController extends Controller {

    public function index(): JsonResponse {
        $customers = Customer::with('user')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    public function show(Customer $customer): JsonResponse {
        $customer->load('user');

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse {
        $user = $customer->user;

        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'email' => [
                'sometimes', 'required', 'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'CIN' => [
                'sometimes', 'nullable', 'string', 'max:50',
                Rule::unique('users', 'CIN')->ignore($user->id),
            ],
            'adresse' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $userData = collect($validated)->only([
            'first_name', 'last_name', 'username', 'email', 'phone', 'CIN'
        ])->all();

        $customerData = collect($validated)->only(['adresse'])->all();

        $user->update($userData);
        $customer->update($customerData);

        return response()->json([
            'message' => 'Customer updated successfully.',
            'data' => $customer->load('user'),
        ]);
    }

    public function destroy(Customer $customer): JsonResponse {
        return response()->json([
            'message' => 'Customer deletion is not yet enabled.',
        ], 409);
    }
}