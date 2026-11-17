<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuthenticateFromCookie
{
    public function __construct(
        private readonly JwtService $jwt
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie(config('jwt.cookie'));

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        try {
            $user = $this->jwt->userFrom($token);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.'
                ], 401);
            }

            $request->setUserResolver(fn () => $user);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired authentication token.'
            ], 401);
        }

        return $next($request);
    }
}
