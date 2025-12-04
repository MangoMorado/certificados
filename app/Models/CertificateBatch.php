<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class CertificateBatch extends Model
{
    protected $fillable = [
        'user_id',
        'certificate_template_id',
        'status',
        'total_certificates',
        'processed_certificates',
        'failed_certificates',
        'error_message',
        'zip_file_path',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $appends = ['zip_file_url', 'progress_percentage'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class, 'certificate_template_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CertificateItem::class);
    }

    public function getZipFileUrlAttribute(): ?string
    {
        if ($this->zip_file_path) {
            return Storage::url($this->zip_file_path);
        }
        return null;
    }

    public function getProgressPercentageAttribute(): int
    {
        if ($this->total_certificates === 0) {
            return 0;
        }
        return (int) round(($this->processed_certificates / $this->total_certificates) * 100);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}

