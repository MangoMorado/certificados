<?php

namespace App\Jobs;

use App\Models\CertificateBatch;
use App\Models\CertificateItem;
use App\Models\CertificateTemplate;
use App\Models\GalleryImage;
use App\Models\Person;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class GenerateCertificatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600; // 1 hora máximo
    public $tries = 1;

    protected int $batchId;

    public function __construct(int $batchId)
    {
        $this->batchId = $batchId;
    }

    public function handle(): void
    {
        $batch = CertificateBatch::find($this->batchId);
        
        if (!$batch) {
            Log::error("CertificateBatch not found: {$this->batchId}");
            return;
        }

        try {
            $batch->update([
                'status' => 'processing',
                'started_at' => now(),
            ]);

            $template = CertificateTemplate::with('positions')->find($batch->certificate_template_id);
            
            if (!$template) {
                throw new \Exception('Template not found');
            }

            $items = CertificateItem::where('certificate_batch_id', $batch->id)
                ->with('person')
                ->get();

            $generatedFiles = [];
            $processed = 0;
            $failed = 0;

            foreach ($items as $item) {
                try {
                    $person = $item->person;
                    
                    if (!$person) {
                        throw new \Exception('Person not found');
                    }

                    // Generar el certificado
                    $pdf = $this->generateCertificate($template, $person, $template->positions);
                    
                    // Guardar el archivo
                    $fileName = 'certificado_' . ($person->cedula ?: $person->id) . '_' . time() . '_' . $item->id . '.pdf';
                    $filePath = 'certificates/batch_' . $batch->id . '/' . $fileName;
                    
                    Storage::disk('public')->put($filePath, $pdf);
                    
                    $item->update([
                        'status' => 'completed',
                        'file_path' => $filePath,
                    ]);

                    $generatedFiles[] = $filePath;
                    $processed++;

                } catch (\Exception $e) {
                    Log::error("Error generating certificate for person {$item->person_id}: " . $e->getMessage());
                    
                    $item->update([
                        'status' => 'failed',
                        'error_message' => $e->getMessage(),
                    ]);
                    
                    $failed++;
                }

                // Actualizar progreso
                $batch->update([
                    'processed_certificates' => $processed + $failed,
                    'failed_certificates' => $failed,
                ]);
            }

            // Crear ZIP si hay archivos generados
            $zipPath = null;
            if (count($generatedFiles) > 0) {
                $zipPath = $this->createZipFile($batch, $generatedFiles);
            }

            $batch->update([
                'status' => 'completed',
                'processed_certificates' => $processed + $failed,
                'failed_certificates' => $failed,
                'zip_file_path' => $zipPath,
                'completed_at' => now(),
            ]);

        } catch (\Exception $e) {
            Log::error("Error processing batch {$this->batchId}: " . $e->getMessage());
            
            $batch->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
        }
    }

    private function generateCertificate($template, $person, $positions)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('isPhpEnabled', true);
        $options->set('chroot', storage_path('app/public'));
        
        $dompdf = new Dompdf($options);
        $html = $this->imageToHtml($template, $person, $positions);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->render();

        return $dompdf->output();
    }

    private function imageToHtml($template, $person, $positions)
    {
        $imagePath = Storage::disk('public')->path($template->file_path);
        
        if (!file_exists($imagePath)) {
            throw new \Exception("La imagen del template no existe: {$imagePath}");
        }
        
        $imageData = file_get_contents($imagePath);
        $imageBase64 = base64_encode($imageData);
        $imageInfo = getimagesize($imagePath);
        
        if (!$imageInfo) {
            throw new \Exception("No se pudo leer la información de la imagen");
        }
        
        $imgWidth = $imageInfo[0];
        $imgHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];
        
        $widthPt = $imgWidth * 0.75;
        $heightPt = $imgHeight * 0.75;
        $scaleFactor = 0.75;
        
        $namePos = $positions->firstWhere('field_type', 'name');
        $cedulaPos = $positions->firstWhere('field_type', 'cedula');

        $labelPositions = $positions->filter(function($pos) {
            return $pos->field_type === 'label' && ($pos->enabled ?? true);
        });

        $imagePositions = $positions->filter(function($pos) {
            return $pos->field_type === 'image' && ($pos->enabled ?? true);
        });

        $googleFonts = [];
        if ($namePos && $this->isGoogleFont($namePos->font_family)) {
            $googleFonts[] = $namePos->font_family;
        }
        if ($cedulaPos && $this->isGoogleFont($cedulaPos->font_family)) {
            $googleFonts[] = $cedulaPos->font_family;
        }
        foreach ($labelPositions as $labelPos) {
            if ($this->isGoogleFont($labelPos->font_family)) {
                $googleFonts[] = $labelPos->font_family;
            }
        }
        $googleFonts = array_unique($googleFonts);
        
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>';
        
        if (!empty($googleFonts)) {
            foreach ($googleFonts as $font) {
                $fontUrl = 'https://fonts.googleapis.com/css2?family=' . urlencode($font) . ':wght@100;200;300;400;500;600;700;800;900&display=swap';
                $html .= "\n        @import url('" . $fontUrl . "');";
            }
        }
        
        $html .= '
        @page {
            size: ' . $widthPt . 'pt ' . $heightPt . 'pt;
            margin: 0;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            width: ' . $widthPt . 'pt;
            height: ' . $heightPt . 'pt;
            overflow: hidden;
        }
        .certificate-container {
            position: relative;
            width: ' . $widthPt . 'pt;
            height: ' . $heightPt . 'pt;
            margin: 0;
            padding: 0;
            page-break-after: avoid;
            page-break-inside: avoid;
        }
        .certificate-image {
            position: absolute;
            top: 0;
            left: 0;
            width: ' . $widthPt . 'pt;
            height: ' . $heightPt . 'pt;
            z-index: 1;
        }
        .text-overlay {
            position: absolute;
            z-index: 2;
            white-space: nowrap;
            line-height: 1;
        }
    </style>
</head>
<body>
    <div class="certificate-container">';

        $html .= '<img class="certificate-image" src="data:' . $mimeType . ';base64,' . $imageBase64 . '" />';

        if ($namePos) {
            $html .= $this->generateTextOverlay($namePos, $person->name, $scaleFactor, $widthPt);
        }

        if ($cedulaPos && ($cedulaPos->enabled ?? true)) {
            $html .= $this->generateTextOverlay($cedulaPos, $person->cedula, $scaleFactor, $widthPt);
        }

        foreach ($labelPositions as $labelPos) {
            $labelText = $labelPos->label_text;
            $prefix = '';
            
            if (!empty($labelPos->attribute_key)) {
                $attrs = $person->attributes_data;
                if (isset($attrs[$labelPos->attribute_key])) {
                    $labelText = $attrs[$labelPos->attribute_key];
                    $prefix = $labelPos->prefix ?? '';
                    if (!empty($prefix) && !str_ends_with($prefix, ' ')) {
                        $prefix .= ' ';
                    }
                } else {
                    $labelText = $labelPos->label_text ?: '[' . $labelPos->attribute_key . ']';
                }
            }
            
            $html .= $this->generateTextOverlayWithPrefix($labelPos, $labelText, $prefix, $scaleFactor, $widthPt);
        }

        foreach ($imagePositions as $imagePos) {
            if (!empty($imagePos->attribute_key)) {
                $attrs = $person->attributes_data;
                $imageName = isset($attrs[$imagePos->attribute_key]) 
                    ? strtolower(trim($attrs[$imagePos->attribute_key])) 
                    : null;
                
                if ($imageName) {
                    $galleryImage = GalleryImage::where('name', $imageName)->first();
                    
                    if ($galleryImage) {
                        $html .= $this->generateImageOverlay($imagePos, $galleryImage, $scaleFactor, $widthPt);
                    }
                }
            }
        }

        $html .= '
    </div>
</body>
</html>';

        return $html;
    }

    private function generateTextOverlay($position, $text, $scaleFactor, $containerWidth)
    {
        return $this->generateTextOverlayWithPrefix($position, $text, '', $scaleFactor, $containerWidth);
    }

    private function generateTextOverlayWithPrefix($position, $text, $prefix, $scaleFactor, $containerWidth)
    {
        $xPt = $position->x * $scaleFactor;
        $yPt = $position->y * $scaleFactor;
        
        $prefixFontSize = $position->prefix_font_size ?? $position->font_size;
        
        $styles = [
            'font-family: ' . htmlspecialchars($position->font_family),
            'font-weight: ' . ($position->font_weight ?? '400'),
            'color: ' . htmlspecialchars($position->font_color),
        ];
        
        $prefixWidth = !empty($prefix) ? $prefixFontSize * 0.6 * mb_strlen($prefix) : 0;
        $textWidth = $position->font_size * 0.6 * mb_strlen($text);
        $totalWidth = $prefixWidth + $textWidth;
        
        if ($position->center_automatically ?? false) {
            $xPt = $containerWidth / 2;
            $styles[] = 'text-align: center';
        } else {
            $textAlign = $position->text_align_horizontal ?? 'left';
            if ($textAlign === 'center') {
                $styles[] = 'text-align: center';
                $xPt = $xPt - ($totalWidth / 2);
            } elseif ($textAlign === 'right') {
                $styles[] = 'text-align: right';
                $xPt = $xPt - $totalWidth;
            } else {
                $styles[] = 'text-align: left';
            }
        }
        
        $verticalAlign = $position->text_align_vertical ?? 'top';
        $transforms = [];
        
        if ($position->center_automatically ?? false) {
            $transforms[] = 'translateX(-50%)';
        }
        
        if ($verticalAlign === 'middle') {
            $transforms[] = 'translateY(-50%)';
        } elseif ($verticalAlign === 'bottom') {
            $transforms[] = 'translateY(-100%)';
        }
        
        if (!empty($transforms)) {
            $styles[] = 'transform: ' . implode(' ', $transforms);
        }
        
        $styleString = implode('; ', $styles);
        
        $html = '<div class="text-overlay" style="left: ' . $xPt . 'pt; top: ' . $yPt . 'pt; ' . $styleString . ';">';
        
        if (!empty($prefix)) {
            $prefixHtml = str_replace(' ', '&nbsp;', htmlspecialchars($prefix));
            $html .= '<span style="font-size: ' . $prefixFontSize . 'pt;">' . $prefixHtml . '</span>';
        }
        
        $html .= '<span style="font-size: ' . $position->font_size . 'pt;">' . htmlspecialchars($text) . '</span>';
        
        $html .= '</div>';
        
        return $html;
    }

    private function generateImageOverlay($position, $galleryImage, $scaleFactor, $containerWidth)
    {
        $xPt = $position->x * $scaleFactor;
        $yPt = $position->y * $scaleFactor;
        $widthPt = ($position->image_width ?? 100) * $scaleFactor;
        $heightPt = ($position->image_height ?? 100) * $scaleFactor;
        
        $imagePath = Storage::disk('public')->path($galleryImage->file_path);
        
        if (!file_exists($imagePath)) {
            return '';
        }
        
        $imageData = file_get_contents($imagePath);
        $imageBase64 = base64_encode($imageData);
        $imageInfo = getimagesize($imagePath);
        $mimeType = $imageInfo['mime'] ?? 'image/png';
        
        if ($position->center_automatically ?? false) {
            $xPt = ($containerWidth / 2) - ($widthPt / 2);
        }
        
        $styles = [
            'width: ' . $widthPt . 'pt',
            'height: ' . $heightPt . 'pt',
            'object-fit: contain',
        ];
        
        $styleString = implode('; ', $styles);
        
        return '<img class="text-overlay" src="data:' . $mimeType . ';base64,' . $imageBase64 . '" style="left: ' . $xPt . 'pt; top: ' . $yPt . 'pt; ' . $styleString . ';" />';
    }

    private function isGoogleFont($fontFamily)
    {
        $systemFonts = [
            'Arial', 'Times New Roman', 'Courier New', 'Helvetica',
            'Georgia', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
        ];
        
        return !in_array($fontFamily, $systemFonts);
    }

    private function createZipFile(CertificateBatch $batch, array $files): ?string
    {
        $zipFileName = 'certificados_batch_' . $batch->id . '_' . time() . '.zip';
        $zipPath = 'certificates/zips/' . $zipFileName;
        $fullZipPath = Storage::disk('public')->path($zipPath);
        
        // Asegurar que el directorio existe
        $zipDir = dirname($fullZipPath);
        if (!is_dir($zipDir)) {
            mkdir($zipDir, 0755, true);
        }

        $zip = new ZipArchive();
        
        if ($zip->open($fullZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception("No se pudo crear el archivo ZIP");
        }

        foreach ($files as $file) {
            $fullPath = Storage::disk('public')->path($file);
            if (file_exists($fullPath)) {
                $zip->addFile($fullPath, basename($file));
            }
        }

        $zip->close();

        return $zipPath;
    }

    public function failed(\Throwable $exception): void
    {
        $batch = CertificateBatch::find($this->batchId);
        
        if ($batch) {
            $batch->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
                'completed_at' => now(),
            ]);
        }

        Log::error("GenerateCertificatesJob failed for batch {$this->batchId}: " . $exception->getMessage());
    }
}

