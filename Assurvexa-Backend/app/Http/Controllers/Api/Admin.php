<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Http\Resources\UserResource;

class AdminController extends Controller {
    
    public function index(): JsonResponse {
        $admins = Admin::with('user')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $admins,
        ]);
    }

    public function show(Admin $admin): JsonResponse {
        $admin->load('user');

        return response()->json([
            'success' => true,
            'data' => $admin,
        ]);
    }

    public function store(Request $request): JsonResponse {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'CIN' => ['required', 'string', 'max:50', 'unique:users,CIN'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $admin = DB::transaction(function () use ($validated) {

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'username' => $validated['username'],
                'CIN' => $validated['CIN'],
                'phone' => $validated['phone'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'admin',
            ]);

            return Admin::create([
                'user_id' => $user->id,
            ]);
        });

        $admin->load('user');

        return response()->json([
            'message' => 'Administrator created successfully.',
            'data' => $admin,
        ], 201);
    }

    public function update(Request $request, Admin $admin): JsonResponse {
        $user = $admin->user;

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
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Administrator updated successfully.',
            'data' => new UserResource($user->refresh()),
        ]);
    }

    public function destroy($id): JsonResponse {
        $admin = Admin::findOrFail($id);

        if ($admin->user) {
        $admin->user->delete();
        }

        $admin->delete();

        return response()->json([
            'message' => 'Administrator deletion is not yet enabled.',
        ], 409);
    }
}