<?php

return [
    'secret' => env('JWT_SECRET', env('APP_KEY')),
    'ttl' => (int) env('JWT_TTL', 120),
    'cookie' => env('JWT_COOKIE', 'auth_token'),
    'cookie_secure' => env('JWT_COOKIE_SECURE') === null
        ? env('APP_ENV') === 'production'
        : filter_var(env('JWT_COOKIE_SECURE'), FILTER_VALIDATE_BOOLEAN),
    'cookie_same_site' => env('JWT_COOKIE_SAME_SITE', 'lax'),
];
