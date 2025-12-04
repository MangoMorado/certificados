<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Person extends Model
{
    protected $fillable = [
        'name',
        'cedula',
        'attributes',
    ];

    protected $casts = [
        'attributes' => 'array',
    ];

    /**
     * Obtener un atributo dinámico específico del campo 'attributes'
     */
    public function getDynamicAttribute(string $key): ?string
    {
        $attrs = $this->attributes_data;
        return $attrs[$key] ?? null;
    }

    /**
     * Accessor para obtener los atributos como array
     */
    public function getAttributesDataAttribute(): array
    {
        // Usar getAttributeValue para obtener el valor con el cast aplicado
        return $this->getAttributeValue('attributes') ?? [];
    }
}
