<?php

namespace App\Http\Controllers;

use App\Models\Person;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PersonController extends Controller
{
    public function index()
    {
        $people = Person::orderBy('created_at', 'desc')->get();
        
        // Obtener todos los atributos únicos de todas las personas
        $attributeKeys = [];
        foreach ($people as $person) {
            $attrs = $person->attributes_data;
            if (!empty($attrs)) {
                foreach (array_keys($attrs) as $key) {
                    if (!in_array($key, $attributeKeys)) {
                        $attributeKeys[] = $key;
                    }
                }
            }
        }
        sort($attributeKeys);
        
        return Inertia::render('People/Index', [
            'people' => $people,
            'attribute_keys' => $attributeKeys,
        ]);
    }

    public function create()
    {
        // Obtener los atributos dinámicos usados en labels de todas las plantillas
        $dynamicAttributes = \App\Models\CertificatePosition::where('field_type', 'label')
            ->whereNotNull('attribute_key')
            ->where('attribute_key', '!=', '')
            ->distinct()
            ->pluck('attribute_key')
            ->toArray();
        
        return Inertia::render('People/Create', [
            'dynamic_attributes' => $dynamicAttributes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'cedula' => 'required|string|max:255',
        ]);

        Person::create([
            'name' => $request->name,
            'cedula' => $request->cedula,
        ]);

        return redirect()->route('people.index');
    }

    public function storeBulk(Request $request)
    {
        $request->validate([
            'bulk_text' => 'required|string',
        ]);

        $lines = explode("\n", $request->bulk_text);
        $people = [];
        $errors = [];
        $headers = [];
        $hasHeaders = false;

        foreach ($lines as $lineNumber => $line) {
            $line = trim($line);
            
            // Saltar líneas vacías
            if (empty($line)) {
                continue;
            }

            // Separar por coma (soportando múltiples columnas)
            $parts = array_map('trim', explode(',', $line));
            
            // Primera línea no vacía: detectar si es header
            if (empty($headers)) {
                // Verificar si parece ser un header (primera columna contiene palabras clave)
                $firstCol = strtolower($parts[0]);
                $headerKeywords = ['nombre', 'name', 'cedula', 'id', 'documento'];
                $hasHeaders = false;
                foreach ($headerKeywords as $keyword) {
                    if (strpos($firstCol, $keyword) !== false) {
                        $hasHeaders = true;
                        break;
                    }
                }
                
                if ($hasHeaders) {
                    // Usar la primera línea como headers
                    $headers = $this->normalizeHeaders($parts);
                    continue;
                } else {
                    // No hay headers, asumir formato: Nombre, Cédula, [Atributo1], [Atributo2]...
                    $headers = ['nombre', 'cedula'];
                    for ($i = 2; $i < count($parts); $i++) {
                        $headers[] = 'atributo_' . ($i - 1);
                    }
                }
            }

            // Validar que tenga al menos 1 columna (nombre)
            if (count($parts) < 1 || empty($parts[0])) {
                $errors[] = "Línea " . ($lineNumber + 1) . ": Falta el nombre";
                continue;
            }

            // Construir datos de la persona
            $personData = [
                'name' => $parts[0],
                'cedula' => $parts[1] ?? '',
                'attributes' => [],
            ];

            // Agregar atributos adicionales
            for ($i = 2; $i < count($parts); $i++) {
                $headerKey = $headers[$i] ?? 'atributo_' . ($i - 1);
                $personData['attributes'][$headerKey] = $parts[$i];
            }

            // Si la segunda columna no es una cédula válida (no es numérica), 
            // moverla a atributos y dejar cédula vacía
            if (!empty($personData['cedula']) && !is_numeric(preg_replace('/[^0-9]/', '', $personData['cedula']))) {
                // La "cédula" parece ser texto, moverla a atributos
                $cedulaHeader = $headers[1] ?? 'atributo_1';
                if ($cedulaHeader !== 'cedula' && $cedulaHeader !== 'documento' && $cedulaHeader !== 'id') {
                    $personData['attributes'][$cedulaHeader] = $personData['cedula'];
                    $personData['cedula'] = '';
                }
            }

            $people[] = $personData;
        }

        if (!empty($errors)) {
            return back()->withErrors(['bulk_text' => implode("\n", $errors)]);
        }

        if (empty($people)) {
            return back()->withErrors(['bulk_text' => 'No se encontraron personas válidas en el texto']);
        }

        // Recopilar todos los atributos únicos encontrados
        $allAttributes = [];
        foreach ($people as $personData) {
            foreach ($personData['attributes'] as $key => $value) {
                if (!in_array($key, $allAttributes)) {
                    $allAttributes[] = $key;
                }
            }
        }

        foreach ($people as $personData) {
            Person::create([
                'name' => $personData['name'],
                'cedula' => $personData['cedula'],
                'attributes' => !empty($personData['attributes']) ? $personData['attributes'] : null,
            ]);
        }

        $message = count($people) . ' persona(s) agregada(s) correctamente.';
        if (!empty($allAttributes)) {
            $message .= ' Atributos detectados: ' . implode(', ', $allAttributes);
        }

        return redirect()->route('people.index')->with('success', $message);
    }

    /**
     * Normalizar headers para usar como claves
     */
    private function normalizeHeaders(array $headers): array
    {
        return array_map(function($header) {
            // Convertir a minúsculas, reemplazar espacios con guiones bajos
            $normalized = strtolower(trim($header));
            $normalized = preg_replace('/[^a-z0-9áéíóúñü]/u', '_', $normalized);
            $normalized = preg_replace('/_+/', '_', $normalized);
            $normalized = trim($normalized, '_');
            return $normalized ?: 'atributo';
        }, $headers);
    }

    public function show(string $id)
    {
        $person = Person::findOrFail($id);
        return Inertia::render('People/Show', [
            'person' => $person,
        ]);
    }

    public function edit(string $id)
    {
        $person = Person::findOrFail($id);
        
        // Obtener todos los atributos únicos de todas las personas
        $allPeople = Person::whereNotNull('attributes')->get();
        $attributeKeys = [];
        foreach ($allPeople as $p) {
            $attrs = $p->attributes_data;
            if (!empty($attrs)) {
                foreach (array_keys($attrs) as $key) {
                    if (!in_array($key, $attributeKeys)) {
                        $attributeKeys[] = $key;
                    }
                }
            }
        }
        
        // También incluir los atributos propios de esta persona (por si tiene atributos únicos)
        $personAttrs = $person->attributes_data;
        if (!empty($personAttrs)) {
            foreach (array_keys($personAttrs) as $key) {
                if (!in_array($key, $attributeKeys)) {
                    $attributeKeys[] = $key;
                }
            }
        }
        
        sort($attributeKeys);
        
        // Enviar la persona con sus atributos como array
        $personData = $person->toArray();
        $personData['attributes'] = $person->attributes_data;
        
        return Inertia::render('People/Edit', [
            'person' => $personData,
            'attribute_keys' => $attributeKeys,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $person = Person::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'cedula' => 'nullable|string|max:255',
            'attributes' => 'nullable|array',
            'attributes.*' => 'nullable|string|max:255',
        ]);

        // Obtener atributos existentes y hacer merge con los nuevos
        $existingAttributes = $person->attributes_data;
        $newAttributes = $request->input('attributes', []);
        
        // Combinar atributos: los nuevos sobrescriben los existentes
        $mergedAttributes = array_merge($existingAttributes, is_array($newAttributes) ? $newAttributes : []);
        
        // Filtrar valores vacíos si se desea (opcional)
        $mergedAttributes = array_filter($mergedAttributes, function($value) {
            return $value !== null && $value !== '';
        });

        $person->update([
            'name' => $request->name,
            'cedula' => $request->cedula ?? '',
            'attributes' => !empty($mergedAttributes) ? $mergedAttributes : null,
        ]);

        return redirect()->route('people.index');
    }

    public function destroy(string $id)
    {
        $person = Person::findOrFail($id);
        $person->delete();

        return redirect()->route('people.index');
    }

    /**
     * Obtener todos los atributos únicos de todas las personas
     */
    public function getAvailableAttributes()
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

        return response()->json([
            'attributes' => $attributes,
        ]);
    }
}
