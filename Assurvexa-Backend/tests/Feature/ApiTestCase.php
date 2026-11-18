<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.key' => 'base64:'.base64_encode(str_repeat('a', 32)),
            'jwt.secret' => str_repeat('b', 32),
            'jwt.cookie' => 'auth_token',
        ]);
    }

    protected function authenticateAs(User $user): void
    {
        $this->withCredentials()->withUnencryptedCookie(
            config('jwt.cookie'),
            app(JwtService::class)->issue($user),
        );
    }
}
