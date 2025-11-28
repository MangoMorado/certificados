<?php

namespace App\Http\Controllers;

use App\Models\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $apiKey = Settings::get('google_fonts_api_key', '');
        
        return Inertia::render('Settings/Index', [
            'google_fonts_api_key' => $apiKey,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'google_fonts_api_key' => 'nullable|string|max:255',
        ]);

        Settings::set('google_fonts_api_key', $request->google_fonts_api_key ?? '');

        return redirect()->route('settings.index')->with('success', 'Configuración guardada correctamente.');
    }
}
