<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CertificateTemplate extends Model
{
    protected $fillable = [
        'name',
        'file_path',
        'file_type',
    ];

    public function positions(): HasMany
    {
        return $this->hasMany(CertificatePosition::class);
    }
}
