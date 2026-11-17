<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(): JsonResponse
    {
        abort_unless(
            in_array(request()->user()->role, ['admin', 'agent'], true),
            403,
            'Only administrators and agents can view customers.'
        );

        $customers = Customer::with('user')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'agent'], true),
            403,
            'Only administrators and agents can create customers.'
        );

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'CIN' => ['required', 'string', 'max:50', 'unique:users,CIN'],
            'adresse' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $customer = DB::transaction(function () use ($validated) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'username' => $validated['username'],
                'CIN' => $validated['CIN'],
                'phone' => $validated['phone'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'customer',
            ]);

            return Customer::create([
                'user_id' => $user->id,
                'adresse' => $validated['adresse'],
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully.',
            'data' => $customer->load('user'),
        ], 201);
    }

    public function show(Request $request, Customer $customer): JsonResponse
    {
        $user = $request->user();
        $allowed = in_array($user->role, ['admin', 'agent'], true);

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
            in_array($request->user()->role, ['admin', 'agent'], true),
            403,
            'Only administrators and agents can update customers.'
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

    public function destroy(Customer $customer): JsonResponse
    {
        abort_unless(
            in_array(request()->user()->role, ['admin', 'agent'], true),
            403,
            'Only administrators and agents can delete customers.'
        );

        if ($customer->user) {
            $customer->user->delete();
        }

        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully.',
        ], 200);
    }
}
