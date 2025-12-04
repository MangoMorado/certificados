<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class GalleryImage extends Model
{
    protected $fillable = [
        'name',
        'original_name',
        'file_path',
        'file_type',
        'width',
        'height',
    ];

    /**
     * Obtener la URL pública de la imagen
     */
    public function getFileUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    /**
     * Agregar file_url al array/JSON
     */
    protected $appends = ['file_url'];
}

