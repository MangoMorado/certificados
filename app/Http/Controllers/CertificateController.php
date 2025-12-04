<?php

namespace App\Http\Controllers;

use App\Models\CertificatePosition;
use App\Models\CertificateTemplate;
use App\Models\Person;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function configure(string $templateId)
    {
        $template = CertificateTemplate::with('positions')->findOrFail($templateId);
        $template->file_url = Storage::url($template->file_path);
        $googleFontsApiKey = \App\Models\Settings::get('google_fonts_api_key', '');
        
        // Obtener atributos disponibles de las personas
        $availableAttributes = $this->getAvailableAttributes();
        
        return Inertia::render('Certificates/Configure', [
            'template' => $template,
            'google_fonts_api_key' => $googleFontsApiKey,
            'available_attributes' => $availableAttributes,
        ]);
    }
    
    /**
     * Obtener todos los atributos únicos de todas las personas
     */
    private function getAvailableAttributes(): array
    {
        $people = Person::whereNotNull('attributes')->get();
        $attributes = [];

        foreach ($people as $person) {
            $attrs = $person->attributes_data;
            if (!empty($attrs)) {
                foreach ($attrs as $key => $value) {
                    if (!in_array($key, $attributes)) {
                        $attributes[] = $key;
                    }
                }
            }
        }

        sort($attributes);
        return $attributes;
    }
    
    public function searchGoogleFonts(Request $request)
    {
        $query = $request->get('q', '');
        $apiKey = \App\Models\Settings::get('google_fonts_api_key', '');
        
        // Construir URL de la API de Google Fonts
        $url = 'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity';
        if ($apiKey) {
            $url .= '&key=' . urlencode($apiKey);
        }
        
        try {
            $response = file_get_contents($url);
            $data = json_decode($response, true);
            
            if (!isset($data['items'])) {
                return response()->json(['fonts' => []]);
            }
            
            $fonts = $data['items'];
            
            // Filtrar por búsqueda si hay query
            if ($query) {
                $queryLower = strtolower($query);
                $fonts = array_filter($fonts, function($font) use ($queryLower) {
                    return strpos(strtolower($font['family']), $queryLower) !== false;
                });
            }
            
            // Limitar a 20 resultados
            $fonts = array_slice($fonts, 0, 20);
            
            // Formatear respuesta
            $formattedFonts = array_map(function($font) {
                return [
                    'family' => $font['family'],
                    'category' => $font['category'] ?? 'sans-serif',
                ];
            }, $fonts);
            
            return response()->json(['fonts' => array_values($formattedFonts)]);
        } catch (\Exception $e) {
            \Log::error('Error fetching Google Fonts: ' . $e->getMessage());
            return response()->json(['fonts' => [], 'error' => 'Error al obtener las fuentes'], 500);
        }
    }

    public function generatePage()
    {
        $templates = CertificateTemplate::all();
        $people = Person::all();
        
        return Inertia::render('Certificates/Generate', [
            'templates' => $templates,
            'people' => $people,
        ]);
    }

    public function savePositions(Request $request, string $templateId)
    {
        $request->validate([
            'positions' => 'required|array',
            'positions.name' => 'required|array',
            'positions.name.x' => 'nullable|numeric',
            'positions.name.y' => 'required|numeric',
            'positions.name.font_size' => 'nullable|integer|min:8|max:200',
            'positions.name.font_family' => 'nullable|string',
            'positions.name.font_weight' => 'nullable|string',
            'positions.name.font_color' => 'nullable|string',
            'positions.name.text_align_horizontal' => 'nullable|in:left,center,right',
            'positions.name.text_align_vertical' => 'nullable|in:top,middle,bottom',
            'positions.name.center_automatically' => 'nullable|boolean',
            'positions.cedula' => 'required|array',
            'positions.cedula.x' => 'nullable|numeric',
            'positions.cedula.y' => 'required|numeric',
            'positions.cedula.font_size' => 'nullable|integer|min:8|max:200',
            'positions.cedula.font_family' => 'nullable|string',
            'positions.cedula.font_weight' => 'nullable|string',
            'positions.cedula.font_color' => 'nullable|string',
            'positions.cedula.text_align_horizontal' => 'nullable|in:left,center,right',
            'positions.cedula.text_align_vertical' => 'nullable|in:top,middle,bottom',
            'positions.cedula.center_automatically' => 'nullable|boolean',
            'positions.cedula.enabled' => 'nullable|boolean',
            'labels' => 'nullable|array',
            'labels.*.id' => 'nullable|string',
            'labels.*.label_text' => 'nullable|string|max:255',
            'labels.*.attribute_key' => 'nullable|string|max:100',
            'labels.*.prefix' => 'nullable|string|max:50',
            'labels.*.prefix_font_size' => 'nullable|integer|min:8|max:200',
            'labels.*.x' => 'nullable|numeric',
            'labels.*.y' => 'required|numeric',
            'labels.*.font_size' => 'nullable|integer|min:8|max:200',
            'labels.*.font_family' => 'nullable|string',
            'labels.*.font_weight' => 'nullable|string',
            'labels.*.font_color' => 'nullable|string',
            'labels.*.text_align_horizontal' => 'nullable|in:left,center,right',
            'labels.*.text_align_vertical' => 'nullable|in:top,middle,bottom',
            'labels.*.center_automatically' => 'nullable|boolean',
            'labels.*.enabled' => 'nullable|boolean',
            'images' => 'nullable|array',
            'images.*.id' => 'nullable|string',
            'images.*.attribute_key' => 'nullable|string|max:100',
            'images.*.x' => 'nullable|numeric',
            'images.*.y' => 'required|numeric',
            'images.*.image_width' => 'nullable|integer|min:10|max:1000',
            'images.*.image_height' => 'nullable|integer|min:10|max:1000',
            'images.*.center_automatically' => 'nullable|boolean',
            'images.*.enabled' => 'nullable|boolean',
        ]);

        // Eliminar posiciones existentes
        CertificatePosition::where('certificate_template_id', $templateId)->delete();

        // Crear posición para nombre
        CertificatePosition::create([
            'certificate_template_id' => $templateId,
            'field_type' => 'name',
            'x' => $request->positions['name']['center_automatically'] ? 0 : ($request->positions['name']['x'] ?? 0),
            'y' => $request->positions['name']['y'],
            'font_size' => $request->positions['name']['font_size'] ?? 16,
            'font_family' => $request->positions['name']['font_family'] ?? 'Arial',
            'font_weight' => $request->positions['name']['font_weight'] ?? '400',
            'font_color' => $request->positions['name']['font_color'] ?? '#000000',
            'text_align_horizontal' => $request->positions['name']['text_align_horizontal'] ?? 'left',
            'text_align_vertical' => $request->positions['name']['text_align_vertical'] ?? 'top',
            'center_automatically' => $request->positions['name']['center_automatically'] ?? false,
        ]);

        // Crear posición para cédula
        CertificatePosition::create([
            'certificate_template_id' => $templateId,
            'field_type' => 'cedula',
            'x' => $request->positions['cedula']['center_automatically'] ? 0 : ($request->positions['cedula']['x'] ?? 0),
            'y' => $request->positions['cedula']['y'],
            'font_size' => $request->positions['cedula']['font_size'] ?? 14,
            'font_family' => $request->positions['cedula']['font_family'] ?? 'Arial',
            'font_weight' => $request->positions['cedula']['font_weight'] ?? '400',
            'font_color' => $request->positions['cedula']['font_color'] ?? '#000000',
            'text_align_horizontal' => $request->positions['cedula']['text_align_horizontal'] ?? 'left',
            'text_align_vertical' => $request->positions['cedula']['text_align_vertical'] ?? 'top',
            'center_automatically' => $request->positions['cedula']['center_automatically'] ?? false,
            'enabled' => $request->positions['cedula']['enabled'] ?? true,
        ]);

        // Crear posiciones para labels personalizados
        if ($request->has('labels') && is_array($request->labels)) {
            foreach ($request->labels as $label) {
                CertificatePosition::create([
                    'certificate_template_id' => $templateId,
                    'field_type' => 'label',
                    'label_text' => $label['label_text'] ?? null,
                    'attribute_key' => $label['attribute_key'] ?? null,
                    'prefix' => $label['prefix'] ?? null,
                    'prefix_font_size' => $label['prefix_font_size'] ?? null,
                    'x' => ($label['center_automatically'] ?? false) ? 0 : ($label['x'] ?? 0),
                    'y' => $label['y'],
                    'font_size' => $label['font_size'] ?? 14,
                    'font_family' => $label['font_family'] ?? 'Arial',
                    'font_weight' => $label['font_weight'] ?? '400',
                    'font_color' => $label['font_color'] ?? '#000000',
                    'text_align_horizontal' => $label['text_align_horizontal'] ?? 'left',
                    'text_align_vertical' => $label['text_align_vertical'] ?? 'top',
                    'center_automatically' => $label['center_automatically'] ?? false,
                    'enabled' => $label['enabled'] ?? true,
                ]);
            }
        }

        // Crear posiciones para imágenes personalizadas
        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $image) {
                CertificatePosition::create([
                    'certificate_template_id' => $templateId,
                    'field_type' => 'image',
                    'attribute_key' => $image['attribute_key'] ?? null,
                    'x' => ($image['center_automatically'] ?? false) ? 0 : ($image['x'] ?? 0),
                    'y' => $image['y'],
                    'image_width' => $image['image_width'] ?? 100,
                    'image_height' => $image['image_height'] ?? 100,
                    'center_automatically' => $image['center_automatically'] ?? false,
                    'enabled' => $image['enabled'] ?? true,
                ]);
            }
        }

        return redirect()->route('templates.show', $templateId);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'template_id' => 'required|exists:certificate_templates,id',
            'person_ids' => 'required|array',
            'person_ids.*' => 'exists:people,id',
        ]);

        $template = CertificateTemplate::with('positions')->findOrFail($request->template_id);
        $people = Person::whereIn('id', $request->person_ids)->get();
        $positions = $template->positions;

        // Si hay más de 5 certificados, usar el sistema de jobs
        if (count($request->person_ids) > 5) {
            return $this->generateAsync($request, $template, $people);
        }

        // Generación síncrona para pocos certificados
        $generatedFiles = [];

        foreach ($people as $person) {
            $pdf = $this->generateCertificate($template, $person, $positions);
            $fileName = 'certificado_' . ($person->cedula ?: $person->id) . '_' . time() . '.pdf';
            $filePath = 'certificates/' . $fileName;
            
            Storage::disk('public')->put($filePath, $pdf);
            $generatedFiles[] = [
                'person' => $person,
                'file_url' => Storage::url($filePath),
                'file_name' => $fileName,
            ];
        }

        return response()->json([
            'success' => true,
            'files' => $generatedFiles,
        ]);
    }

    /**
     * Genera certificados de forma asíncrona usando jobs
     */
    private function generateAsync(Request $request, $template, $people)
    {
        // Crear el batch
        $batch = \App\Models\CertificateBatch::create([
            'user_id' => auth()->id(),
            'certificate_template_id' => $template->id,
            'status' => 'pending',
            'total_certificates' => count($people),
            'processed_certificates' => 0,
            'failed_certificates' => 0,
        ]);

        // Crear los items individuales
        foreach ($people as $person) {
            \App\Models\CertificateItem::create([
                'certificate_batch_id' => $batch->id,
                'person_id' => $person->id,
                'status' => 'pending',
            ]);
        }

        // Despachar el job
        \App\Jobs\GenerateCertificatesJob::dispatch($batch->id);

        return response()->json([
            'success' => true,
            'async' => true,
            'batch_id' => $batch->id,
            'message' => 'La generación de ' . count($people) . ' certificados ha comenzado. Puedes ver el progreso en el historial.',
        ]);
    }

    private function generateCertificate($template, $person, $positions)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('isPhpEnabled', true);
        $options->set('chroot', storage_path('app/public'));
        
        $dompdf = new Dompdf($options);

        // Generar HTML con la imagen
        $html = $this->imageToHtml($template, $person, $positions);

        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->render();

        return $dompdf->output();
    }

    private function imageToHtml($template, $person, $positions)
    {
        // Leer la imagen del template
        $imagePath = Storage::disk('public')->path($template->file_path);
        
        if (!file_exists($imagePath)) {
            throw new \Exception("La imagen del template no existe: {$imagePath}");
        }
        
        // Convertir imagen a base64 para incluirla en el PDF
        $imageData = file_get_contents($imagePath);
        $imageBase64 = base64_encode($imageData);
        $imageInfo = getimagesize($imagePath);
        
        if (!$imageInfo) {
            throw new \Exception("No se pudo leer la información de la imagen");
        }
        
        // Obtener dimensiones de la imagen
        $imgWidth = $imageInfo[0];
        $imgHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];
        
        // Convertir píxeles a puntos (1px = 0.75pt aproximadamente)
        $widthPt = $imgWidth * 0.75;
        $heightPt = $imgHeight * 0.75;
        
        // Factor de escala para convertir coordenadas de píxeles a puntos
        $scaleFactor = 0.75;
        
        // Crear HTML con la imagen y texto superpuesto
        $namePos = $positions->firstWhere('field_type', 'name');
        $cedulaPos = $positions->firstWhere('field_type', 'cedula');

        // Obtener labels personalizados
        $labelPositions = $positions->filter(function($pos) {
            return $pos->field_type === 'label' && ($pos->enabled ?? true);
        });

        // Obtener imágenes personalizadas
        $imagePositions = $positions->filter(function($pos) {
            return $pos->field_type === 'image' && ($pos->enabled ?? true);
        });

        // Obtener fuentes únicas de Google Fonts
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
        
        // Agregar importaciones de Google Fonts con @import (DomPDF no soporta <link> para fuentes externas)
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

        // Insertar imagen como base64
        $html .= '<img class="certificate-image" src="data:' . $mimeType . ';base64,' . $imageBase64 . '" />';

        // Insertar nombre (convertir coordenadas de px a pt)
        if ($namePos) {
            $html .= $this->generateTextOverlay($namePos, $person->name, $scaleFactor, $widthPt);
        }

        // Insertar cédula (convertir coordenadas de px a pt) - solo si está habilitada
        if ($cedulaPos && ($cedulaPos->enabled ?? true)) {
            $html .= $this->generateTextOverlay($cedulaPos, $person->cedula, $scaleFactor, $widthPt);
        }

        // Insertar labels personalizados
        foreach ($labelPositions as $labelPos) {
            // Determinar el texto a mostrar
            $labelText = $labelPos->label_text; // Texto estático por defecto
            $prefix = '';
            
            // Si tiene attribute_key, obtener el valor dinámico de la persona
            if (!empty($labelPos->attribute_key)) {
                // Usar el accessor attributes_data para obtener los atributos correctamente
                $attrs = $person->attributes_data;
                if (isset($attrs[$labelPos->attribute_key])) {
                    $labelText = $attrs[$labelPos->attribute_key];
                    // Agregar prefijo si existe (automáticamente agregar espacio al final si no tiene)
                    $prefix = $labelPos->prefix ?? '';
                    if (!empty($prefix) && !str_ends_with($prefix, ' ')) {
                        $prefix .= ' ';
                    }
                } else {
                    // Si no existe el atributo, usar el texto estático o un placeholder
                    $labelText = $labelPos->label_text ?: '[' . $labelPos->attribute_key . ']';
                }
            }
            
            $html .= $this->generateTextOverlayWithPrefix($labelPos, $labelText, $prefix, $scaleFactor, $widthPt);
        }

        // Insertar imágenes personalizadas
        foreach ($imagePositions as $imagePos) {
            // Obtener el nombre de la imagen desde el atributo de la persona
            if (!empty($imagePos->attribute_key)) {
                $attrs = $person->attributes_data;
                $imageName = isset($attrs[$imagePos->attribute_key]) 
                    ? strtolower(trim($attrs[$imagePos->attribute_key])) 
                    : null;
                
                if ($imageName) {
                    // Buscar la imagen en la galería
                    $galleryImage = \App\Models\GalleryImage::where('name', $imageName)->first();
                    
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
        
        // Determinar tamaño del prefijo
        $prefixFontSize = $position->prefix_font_size ?? $position->font_size;
        
        // Estilos base del contenedor
        $styles = [
            'font-family: ' . htmlspecialchars($position->font_family),
            'font-weight: ' . ($position->font_weight ?? '400'),
            'color: ' . htmlspecialchars($position->font_color),
        ];
        
        // Calcular ancho total estimado para centrado
        $prefixWidth = !empty($prefix) ? $prefixFontSize * 0.6 * mb_strlen($prefix) : 0;
        $textWidth = $position->font_size * 0.6 * mb_strlen($text);
        $totalWidth = $prefixWidth + $textWidth;
        
        // Si está habilitado el centrado automático, centrar siempre en el contenedor
        if ($position->center_automatically ?? false) {
            // Centrar en el ancho del contenedor
            $xPt = $containerWidth / 2;
            $styles[] = 'text-align: center';
        } else {
            // Aplicar alineación horizontal
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
        
        // Aplicar alineación vertical
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
        
        // Construir el HTML con prefijo y texto principal
        $html = '<div class="text-overlay" style="left: ' . $xPt . 'pt; top: ' . $yPt . 'pt; ' . $styleString . ';">';
        
        // Agregar prefijo con su propio tamaño de fuente
        // Convertir espacios a &nbsp; para que DomPDF los respete
        if (!empty($prefix)) {
            $prefixHtml = str_replace(' ', '&nbsp;', htmlspecialchars($prefix));
            $html .= '<span style="font-size: ' . $prefixFontSize . 'pt;">' . $prefixHtml . '</span>';
        }
        
        // Agregar texto principal con su tamaño de fuente
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
        
        // Leer imagen de la galería y convertir a base64
        $imagePath = \Illuminate\Support\Facades\Storage::disk('public')->path($galleryImage->file_path);
        
        if (!file_exists($imagePath)) {
            return ''; // Si no existe la imagen, no renderizar nada
        }
        
        $imageData = file_get_contents($imagePath);
        $imageBase64 = base64_encode($imageData);
        $imageInfo = getimagesize($imagePath);
        $mimeType = $imageInfo['mime'] ?? 'image/png';
        
        // Si está habilitado el centrado automático
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
        // Lista de fuentes del sistema que NO son de Google Fonts
        $systemFonts = [
            'Arial',
            'Times New Roman',
            'Courier New',
            'Helvetica',
            'Georgia',
            'Verdana',
            'Tahoma',
            'Trebuchet MS',
            'Impact',
            'Comic Sans MS',
        ];
        
        // Si la fuente no está en la lista de fuentes del sistema, asumimos que es de Google Fonts
        return !in_array($fontFamily, $systemFonts);
    }
}
