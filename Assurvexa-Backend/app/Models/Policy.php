<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Policy extends Model
{
    protected $fillable = [
        'admin_id',
        'nom',
        'description',
        'type',
        'prix',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'type' => \App\Enums\InsuranceType::class,
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }
}
