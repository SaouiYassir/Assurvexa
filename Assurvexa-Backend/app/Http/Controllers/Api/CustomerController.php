<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(): JsonResponse
    {
        $customers = Customer::with('user')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    public function show(Request $request, Customer $customer): JsonResponse
    {
        $user = $request->user();
        $allowed = $user->role === 'admin'
            || ($user->role === 'agent')
            || ($user->role === 'customer' && $customer->user_id === $user->id);

        abort_unless($allowed, 403, 'You are not allowed to view this customer.');

        $customer->load('user');

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        abort_unless(
            $request->user()->role === 'admin'
                || $customer->user_id === $request->user()->id,
            403,
            'You can only update your own customer profile.'
        );

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
            'first_name', 'last_name', 'username', 'email', 'phone', 'CIN',
        ])->all();

        $customerData = collect($validated)->only(['adresse'])->all();

        $user->update($userData);
        $customer->update($customerData);

        return response()->json([
            'message' => 'Customer updated successfully.',
            'data' => $customer->load('user'),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        if ($customer->user) {
            $customer->user->delete();
        }

        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully.',
        ], 200);
    }
}
