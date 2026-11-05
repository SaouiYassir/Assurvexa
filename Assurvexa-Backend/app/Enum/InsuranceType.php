<?php

namespace App\Enums;

enum InsuranceType: string
{
    case AUTOMOBILE  = 'automobile';
    case HABITATION = 'habitation';
    case SANTE = 'sante';
    case VIE = 'vie';
    case PROFESSIONNELLE = 'professionnelle';
    case VOYAGE = 'voyage';
}