<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'user_id',
        'adresse'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
