<?php

namespace App\Http\Controllers;

use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class GalleryController extends Controller
{
    public function index()
    {
        $images = GalleryImage::orderBy('name')->get();
        
        return Inertia::render('Gallery/Index', [
            'images' => $images,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:gallery_images,name',
            'image' => 'required|image|mimes:png,jpg,jpeg,gif,webp|max:5120', // 5MB max
        ]);

        $file = $request->file('image');
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        
        // Guardar en storage/app/public/gallery
        $path = $file->store('gallery', 'public');
        
        // Obtener dimensiones de la imagen
        $imageInfo = getimagesize($file->getRealPath());
        $width = $imageInfo[0] ?? null;
        $height = $imageInfo[1] ?? null;

        GalleryImage::create([
            'name' => strtolower(trim($request->name)),
            'original_name' => $originalName,
            'file_path' => $path,
            'file_type' => $extension,
            'width' => $width,
            'height' => $height,
        ]);

        return redirect()->route('gallery.index')->with('success', 'Imagen subida correctamente.');
    }

    public function destroy(string $id)
    {
        $image = GalleryImage::findOrFail($id);
        
        // Eliminar archivo físico
        if (Storage::disk('public')->exists($image->file_path)) {
            Storage::disk('public')->delete($image->file_path);
        }
        
        $image->delete();

        return redirect()->route('gallery.index')->with('success', 'Imagen eliminada correctamente.');
    }

    /**
     * API para obtener lista de imágenes disponibles
     */
    public function list()
    {
        $images = GalleryImage::orderBy('name')->get(['id', 'name', 'file_path', 'width', 'height']);
        
        return response()->json([
            'images' => $images->map(function ($img) {
                return [
                    'id' => $img->id,
                    'name' => $img->name,
                    'file_url' => $img->file_url,
                    'width' => $img->width,
                    'height' => $img->height,
                ];
            }),
        ]);
    }
}

