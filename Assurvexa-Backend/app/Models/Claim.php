<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    protected $fillable = [ 
        'contract_id',    
        'agent_id',
        'customer_id',
        'description',
        'incident_date',
        'prix_estime',
        'status',
        'decision_note',
        'date_review'
    ];

    protected $casts = [
        'incident_date'   => 'date',
        'date_review'     => 'date',
        'prix_estime' => 'decimal:2',
        'status'           => \App\Enums\ClaimStatus::class,
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function reimbursement(): HasOne
    {
        return $this->hasOne(Reimbursement::class);
    }
}
