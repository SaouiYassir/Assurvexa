<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\JwtService;
use Firebase\JWT\ExpiredException;
use DomainException;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;
use UnexpectedValueException;

class AuthenticateWithCookie
{
    public function __construct(private readonly JwtService $jwt)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie(config('jwt.cookie'));

        if (!$token) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        try {
            $user = $this->jwt->userFrom($token);
        } catch (ExpiredException|UnexpectedValueException|DomainException|InvalidArgumentException) {
            $user = null;
        }

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        Auth::setUser($user);
        $request->setUserResolver(fn ($guard = null) => $user);

        return $next($request);
    }
}