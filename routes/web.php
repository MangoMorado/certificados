<?php

use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificateHistoryController;
use App\Http\Controllers\CertificateTemplateController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Rutas para templates de certificados
    Route::resource('templates', CertificateTemplateController::class);
    Route::get('/templates/{template}/configure', [CertificateController::class, 'configure'])->name('certificates.configure');
    Route::post('/templates/{template}/positions', [CertificateController::class, 'savePositions'])->name('certificates.save-positions');
    
    // Rutas para personas
    Route::resource('people', PersonController::class);
    Route::post('/people/bulk', [PersonController::class, 'storeBulk'])->name('people.store-bulk');
    Route::get('/api/people/attributes', [PersonController::class, 'getAvailableAttributes'])->name('api.people.attributes');
    
    // Rutas para generar certificados
    Route::get('/certificates/generate', [CertificateController::class, 'generatePage'])->name('certificates.generate-page');
    Route::post('/certificates/generate', [CertificateController::class, 'generate'])->name('certificates.generate');
    
    // Rutas para historial de certificados
    Route::get('/certificados', [CertificateHistoryController::class, 'index'])->name('certificates.history');
    Route::get('/certificados/{id}', [CertificateHistoryController::class, 'show'])->name('certificates.batch-show');
    Route::get('/api/certificates/batch/{id}/status', [CertificateHistoryController::class, 'status'])->name('certificates.batch-status');
    Route::delete('/certificados/{id}', [CertificateHistoryController::class, 'destroy'])->name('certificates.batch-destroy');
    
    // Rutas para configuración
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
    
    // Ruta para buscar Google Fonts
    Route::get('/api/google-fonts/search', [CertificateController::class, 'searchGoogleFonts'])->name('api.google-fonts.search');
    
    // Rutas para galería de imágenes
    Route::get('/galeria', [GalleryController::class, 'index'])->name('gallery.index');
    Route::post('/galeria', [GalleryController::class, 'store'])->name('gallery.store');
    Route::delete('/galeria/{id}', [GalleryController::class, 'destroy'])->name('gallery.destroy');
    Route::get('/api/gallery/images', [GalleryController::class, 'list'])->name('api.gallery.images');
});

require __DIR__.'/auth.php';
