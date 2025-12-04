<?php

namespace App\Http\Controllers;

use App\Models\CertificateBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateHistoryController extends Controller
{
    public function index()
    {
        $batches = CertificateBatch::with(['template', 'user'])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Certificates/History', [
            'batches' => $batches,
        ]);
    }

    public function show(string $id)
    {
        $batch = CertificateBatch::with(['template', 'items.person'])
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        return Inertia::render('Certificates/BatchDetail', [
            'batch' => $batch,
        ]);
    }

    public function status(string $id)
    {
        $batch = CertificateBatch::where('user_id', auth()->id())
            ->findOrFail($id);

        return response()->json([
            'id' => $batch->id,
            'status' => $batch->status,
            'total_certificates' => $batch->total_certificates,
            'processed_certificates' => $batch->processed_certificates,
            'failed_certificates' => $batch->failed_certificates,
            'progress_percentage' => $batch->progress_percentage,
            'zip_file_url' => $batch->zip_file_url,
            'completed_at' => $batch->completed_at?->toISOString(),
        ]);
    }

    public function destroy(string $id)
    {
        $batch = CertificateBatch::where('user_id', auth()->id())
            ->findOrFail($id);

        // Eliminar archivos
        if ($batch->zip_file_path && Storage::disk('public')->exists($batch->zip_file_path)) {
            Storage::disk('public')->delete($batch->zip_file_path);
        }

        // Eliminar carpeta del batch
        $batchFolder = 'certificates/batch_' . $batch->id;
        if (Storage::disk('public')->exists($batchFolder)) {
            Storage::disk('public')->deleteDirectory($batchFolder);
        }

        $batch->delete();

        return redirect()->route('certificates.history')->with('success', 'Batch eliminado correctamente.');
    }
}

