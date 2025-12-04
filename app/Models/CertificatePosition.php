<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificatePosition extends Model
{
    protected $fillable = [
        'certificate_template_id',
        'field_type',
        'label_text',
        'attribute_key',
        'prefix',
        'prefix_font_size',
        'image_width',
        'image_height',
        'x',
        'y',
        'font_size',
        'font_family',
        'font_weight',
        'font_color',
        'text_align_horizontal',
        'text_align_vertical',
        'center_automatically',
        'enabled',
    ];

    protected $casts = [
        'x' => 'decimal:2',
        'y' => 'decimal:2',
        'font_size' => 'integer',
        'center_automatically' => 'boolean',
        'enabled' => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class);
    }
}
