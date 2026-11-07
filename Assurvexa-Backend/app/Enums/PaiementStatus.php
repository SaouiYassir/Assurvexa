<?php

namespace App\Enums;

enum PaiementStatus: string
{
    case PENDING  = 'pending';
    case PAID = 'paid';
    case FAILED = 'failed';
}