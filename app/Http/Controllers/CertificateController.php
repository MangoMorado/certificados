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
        
        return Inertia::render('Certificates/Configure', [
            'template' => $template,
            'google_fonts_api_key' => $googleFontsApiKey,
        ]);
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
            'positions.name.font_size' => 'nullable|integer|min:8|max:72',
            'positions.name.font_family' => 'nullable|string',
            'positions.name.font_color' => 'nullable|string',
            'positions.name.text_align_horizontal' => 'nullable|in:left,center,right',
            'positions.name.text_align_vertical' => 'nullable|in:top,middle,bottom',
            'positions.name.center_automatically' => 'nullable|boolean',
            'positions.cedula' => 'required|array',
            'positions.cedula.x' => 'nullable|numeric',
            'positions.cedula.y' => 'required|numeric',
            'positions.cedula.font_size' => 'nullable|integer|min:8|max:72',
            'positions.cedula.font_family' => 'nullable|string',
            'positions.cedula.font_color' => 'nullable|string',
            'positions.cedula.text_align_horizontal' => 'nullable|in:left,center,right',
            'positions.cedula.text_align_vertical' => 'nullable|in:top,middle,bottom',
            'positions.cedula.center_automatically' => 'nullable|boolean',
            'positions.cedula.enabled' => 'nullable|boolean',
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
            'font_color' => $request->positions['cedula']['font_color'] ?? '#000000',
            'text_align_horizontal' => $request->positions['cedula']['text_align_horizontal'] ?? 'left',
            'text_align_vertical' => $request->positions['cedula']['text_align_vertical'] ?? 'top',
            'center_automatically' => $request->positions['cedula']['center_automatically'] ?? false,
            'enabled' => $request->positions['cedula']['enabled'] ?? true,
        ]);

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
        $positions = $template->positions->keyBy('field_type');

        $generatedFiles = [];

        foreach ($people as $person) {
            $pdf = $this->generateCertificate($template, $person, $positions);
            $fileName = 'certificado_' . $person->cedula . '_' . time() . '.pdf';
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
        $namePos = $positions['name'] ?? null;
        $cedulaPos = $positions['cedula'] ?? null;

        // Obtener fuentes únicas de Google Fonts
        $googleFonts = [];
        if ($namePos && $this->isGoogleFont($namePos->font_family)) {
            $googleFonts[] = $namePos->font_family;
        }
        if ($cedulaPos && $this->isGoogleFont($cedulaPos->font_family)) {
            $googleFonts[] = $cedulaPos->font_family;
        }
        $googleFonts = array_unique($googleFonts);
        
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>';
        
        // Agregar importaciones de Google Fonts
        if (!empty($googleFonts)) {
            $fontsUrl = 'https://fonts.googleapis.com/css2?';
            $fontsParams = [];
            foreach ($googleFonts as $font) {
                $fontsParams[] = 'family=' . urlencode($font) . ':wght@400;700';
            }
            $fontsUrl .= implode('&', $fontsParams) . '&display=swap';
            $html .= "\n    <link href=\"" . htmlspecialchars($fontsUrl) . "\" rel=\"stylesheet\">";
        }
        
        $html .= '
    <style>
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

        $html .= '
    </div>
</body>
</html>';

        return $html;
    }

    private function generateTextOverlay($position, $text, $scaleFactor, $containerWidth)
    {
        $xPt = $position->x * $scaleFactor;
        $yPt = $position->y * $scaleFactor;
        
        // Estilos base
        $styles = [
            'font-size: ' . $position->font_size . 'pt',
            'font-family: ' . htmlspecialchars($position->font_family),
            'color: ' . htmlspecialchars($position->font_color),
        ];
        
        // Si está habilitado el centrado automático, centrar siempre en el contenedor
        if ($position->center_automatically ?? false) {
            // Centrar en el ancho del contenedor
            $xPt = $containerWidth / 2;
            $styles[] = 'text-align: center';
            $styles[] = 'transform: translateX(-50%)';
        } else {
            // Aplicar alineación horizontal
            $textAlign = $position->text_align_horizontal ?? 'left';
            if ($textAlign === 'center') {
                $styles[] = 'text-align: center';
                // Ajustar X para centrar desde el punto de referencia
                $estimatedWidth = $position->font_size * 0.6 * mb_strlen($text);
                $xPt = $xPt - ($estimatedWidth / 2);
            } elseif ($textAlign === 'right') {
                $styles[] = 'text-align: right';
                $estimatedWidth = $position->font_size * 0.6 * mb_strlen($text);
                $xPt = $xPt - $estimatedWidth;
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
        
        return '<div class="text-overlay" style="left: ' . $xPt . 'pt; top: ' . $yPt . 'pt; ' . $styleString . ';">' . htmlspecialchars($text) . '</div>';
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
