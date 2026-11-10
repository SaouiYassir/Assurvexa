<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    /**
     * Register a new customer.
     * No token is generated during registration.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'username'   => ['required', 'string', 'max:255', 'unique:users,username'],
            'CIN'        => ['required', 'string', 'max:50', 'unique:users,CIN'],
            'adresse'    => ['required', 'string', 'max:255'],
            'phone'      => ['required', 'string', 'max:20'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $customer = DB::transaction(function () use ($validated) {

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name'  => $validated['last_name'],
                'username'   => $validated['username'],
                'CIN'        => $validated['CIN'],
                'phone'      => $validated['phone'],
                'email'      => $validated['email'],
                'password'   => $validated['password'],
                'role'       => 'customer',
            ]);

            $customer = Customer::create([
                'user_id' => $user->id,
                'adresse' => $validated['adresse'],
            ]);

            return $customer;
        });

        return response()->json([
            'message' => 'Registration successful. You can now log in.',
            'customer' => $customer->load('user'),
        ], 201);
    }

    /**
     * Authenticate user and generate Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user->load('customer'),
        ], 200)->cookie($this->authCookie($token, 120));
    }

    /**
     * Revoke the current access token and expire the auth cookie.
     * This route is public so an already invalid session can still clear the cookie.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = Auth::guard('sanctum')->user()?->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ], 200)->cookie($this->authCookie('', -2628000));
    }

    /**
     * Login and logout must use the same name, path, domain, secure and SameSite
     * flags. A mismatch makes the browser keep the old cookie.
     */
    private function authCookie(string $value, int $minutes): Cookie
    {
        return cookie(
            'auth_token',
            $value,
            $minutes,
            '/',
            null,
            false,
            true,
            false,
            'lax'
        );
    }

    /**
     * Return authenticated user information.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('customer'),
        ], 200);
    }
}
