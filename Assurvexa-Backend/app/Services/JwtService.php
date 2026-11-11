<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Carbon;

class JwtService
{
    public function issue(User $user): string
    {
        $now = Carbon::now()->timestamp;
        $ttl = config('jwt.ttl');

        return JWT::encode([
            'iss' => config('app.url'),
            'sub' => $user->getKey(),
            'iat' => $now,
            'exp' => $now + ($ttl * 60),
        ], $this->secret(), 'HS256');
    }

    public function userFrom(string $token): ?User
    {
        $claims = JWT::decode($token, new Key($this->secret(), 'HS256'));
        $userId = $claims->sub ?? null;

        return $userId ? User::find($userId) : null;
    }

    private function secret(): string
    {
        $secret = (string) config('jwt.secret');

        if ($secret === '') {
            throw new \RuntimeException('JWT_SECRET or APP_KEY must be configured.');
        }

        if (str_starts_with($secret, 'base64:')) {
            $secret = base64_decode(substr($secret, 7), true) ?: $secret;
        }

        return $secret;
    }
}
