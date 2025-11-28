<?php

namespace App\Http\Controllers;

use App\Models\CertificateTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateTemplateController extends Controller
{
    public function index()
    {
        $templates = CertificateTemplate::with('positions')->get();
        return Inertia::render('Templates/Index', [
            'templates' => $templates,
        ]);
    }

    public function create()
    {
        return Inertia::render('Templates/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'file' => 'required|file|mimes:png,jpg,jpeg|max:10240',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('templates', $fileName, 'public');

        $template = CertificateTemplate::create([
            'name' => $request->name,
            'file_path' => $filePath,
            'file_type' => $extension,
        ]);

        return redirect()->route('templates.show', $template->id);
    }

    public function show(string $id)
    {
        $template = CertificateTemplate::with('positions')->findOrFail($id);
        $template->file_url = Storage::url($template->file_path);
        
        return Inertia::render('Templates/Show', [
            'template' => $template,
        ]);
    }

    public function edit(string $id)
    {
        $template = CertificateTemplate::with('positions')->findOrFail($id);
        $template->file_url = Storage::url($template->file_path);
        
        return Inertia::render('Templates/Edit', [
            'template' => $template,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $template = CertificateTemplate::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $template->update([
            'name' => $request->name,
        ]);

        return redirect()->route('templates.show', $template->id);
    }

    public function destroy(string $id)
    {
        $template = CertificateTemplate::with('positions')->findOrFail($id);
        
        // Eliminar el archivo físico
        if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
            Storage::disk('public')->delete($template->file_path);
        }
        
        // Eliminar las posiciones relacionadas (se eliminan automáticamente por cascade, pero lo hacemos explícitamente)
        $template->positions()->delete();
        
        // Eliminar el template
        $template->delete();

        return redirect()->route('templates.index')->with('success', 'Diseño eliminado correctamente.');
    }
}
