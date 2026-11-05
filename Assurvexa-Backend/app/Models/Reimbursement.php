<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reimbursement extends Model
{
    protected $fillable = [
        'claim_id',
        'prix',
        'methode_paiement',
        'status_paiement',
        'date_paiement',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'methode_paiement' => \App\Enums\PaiementMethod::class,
        'status_paiement' => \App\Enums\PaiementStatus::class,
        'date_paiement' => 'date'
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }
}
