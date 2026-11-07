<?php

namespace App\Enums;

enum ContractStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';
    case SUSPENDED = 'suspended';
}