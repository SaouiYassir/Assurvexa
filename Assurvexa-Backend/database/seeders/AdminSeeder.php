<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        if (! filter_var(env('ADMIN_AUTO_CREATE', false), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        $password = (string) env('ADMIN_PASSWORD');

        if (strlen($password) < 8) {
            throw new RuntimeException(
                'ADMIN_PASSWORD must be configured and contain at least 8 characters.'
            );
        }

        $user = User::firstOrNew([
            'email' => env('ADMIN_EMAIL', 'admin@example.com'),
        ]);
        $user->fill([
            'first_name' => env('ADMIN_FIRST_NAME', 'System'),
            'last_name' => env('ADMIN_LAST_NAME', 'Administrator'),
            'username' => env('ADMIN_USERNAME', 'admin'),
            'CIN' => env('ADMIN_CIN', 'ADMIN-001'),
            'phone' => env('ADMIN_PHONE', '0000000000'),
            'role' => 'admin',
        ]);

        if (! $user->exists) {
            $user->password = Hash::make($password);
        }

        $user->save();
        Admin::firstOrCreate(['user_id' => $user->id]);
    }
}
