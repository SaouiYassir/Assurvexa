<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Http\Resources\UserResource;

class AgentController extends Controller {
    
    public function index(): JsonResponse {
        $agents = Agent::with('user')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $agents,
        ]);
    }

    public function show(Agent $agent): JsonResponse {
        $agent->load('user');

        return response()->json([
            'success' => true,
            'data' => $agent,
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
            'date_integration' => ['required', 'date'],
        ]);

        $agent = DB::transaction(function () use ($validated) {

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'username' => $validated['username'],
                'CIN' => $validated['CIN'],
                'phone' => $validated['phone'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'agent',
            ]);

            return Agent::create([
                'user_id' => $user->id,
                'date_integration' => $validated['date_integration'],
            ]);
        });

        $agent->load('user');

        return response()->json([
            'message' => 'Agent created successfully.',
            'data' => $agent,
        ], 201);
    }

    public function update(Request $request, Agent $agent): JsonResponse {
        $user = $agent->user;

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
            'date_integration' => ['sometimes', 'required', 'date'],
        ]);

        $userData = collect($validated)->only([
            'first_name', 'last_name', 'username', 'email', 'phone', 'CIN'
        ])->all();

        DB::transaction(function () use ($agent, $user, $userData, $validated) {
            $user->update($userData);

            if (array_key_exists('date_integration', $validated)) {
                $agent->update([
                    'date_integration' => $validated['date_integration'],
                ]);
            }
        });

        return response()->json([
            'message' => 'Agent updated successfully.',
            'data' => $agent->load('user'),
        ]);
    }

    public function destroy(Agent $agent): JsonResponse {
        return response()->json([
            'message' => 'Agent deletion is not yet enabled.',
        ], 409);
    }
}