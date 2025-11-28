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
        return Inertia::render('People/Index', [
            'people' => $people,
        ]);
    }

    public function create()
    {
        return Inertia::render('People/Create');
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

        foreach ($lines as $lineNumber => $line) {
            $line = trim($line);
            
            // Saltar líneas vacías
            if (empty($line)) {
                continue;
            }

            // Intentar separar por coma
            $parts = explode(',', $line, 2);
            
            if (count($parts) !== 2) {
                $errors[] = "Línea " . ($lineNumber + 1) . ": Formato incorrecto. Debe ser 'Nombre, Cédula'";
                continue;
            }

            $name = trim($parts[0]);
            $cedula = trim($parts[1]);

            if (empty($name) || empty($cedula)) {
                $errors[] = "Línea " . ($lineNumber + 1) . ": Nombre y cédula son requeridos";
                continue;
            }

            $people[] = [
                'name' => $name,
                'cedula' => $cedula,
            ];
        }

        if (!empty($errors)) {
            return back()->withErrors(['bulk_text' => implode("\n", $errors)]);
        }

        if (empty($people)) {
            return back()->withErrors(['bulk_text' => 'No se encontraron personas válidas en el texto']);
        }

        foreach ($people as $personData) {
            Person::create([
                'name' => $personData['name'],
                'cedula' => $personData['cedula'],
            ]);
        }

        return redirect()->route('people.index')->with('success', count($people) . ' persona(s) agregada(s) correctamente.');
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
        return Inertia::render('People/Edit', [
            'person' => $person,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $person = Person::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'cedula' => 'required|string|max:255',
        ]);

        $person->update([
            'name' => $request->name,
            'cedula' => $request->cedula,
        ]);

        return redirect()->route('people.index');
    }

    public function destroy(string $id)
    {
        $person = Person::findOrFail($id);
        $person->delete();

        return redirect()->route('people.index');
    }
}
