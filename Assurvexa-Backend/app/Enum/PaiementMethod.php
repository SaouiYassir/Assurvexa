<?php

namespace App\Enums;

enum PaiementMethod: string
{
    case CASH  = 'cash';
    case CHECK = 'check';
    case TRANSFERBANCAIRE = 'transfer_bancaire';
}