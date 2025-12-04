import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function History({ batches: initialBatches }) {
    const [batches, setBatches] = useState(initialBatches);

    // Polling para actualizar el estado de los batches en proceso
    useEffect(() => {
        const processingBatches = batches.filter(b => b.status === 'pending' || b.status === 'processing');
        
        if (processingBatches.length === 0) return;

        const interval = setInterval(() => {
            processingBatches.forEach(async (batch) => {
                try {
                    const response = await fetch(route('certificates.batch-status', batch.id));
                    const data = await response.json();
                    
                    setBatches(prev => prev.map(b => 
                        b.id === batch.id ? { ...b, ...data } : b
                    ));
                } catch (error) {
                    console.error('Error fetching batch status:', error);
                }
            });
        }, 3000); // Cada 3 segundos

        return () => clearInterval(interval);
    }, [batches]);

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar este batch y todos sus certificados?')) {
            router.delete(route('certificates.batch-destroy', id));
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'Pendiente',
            processing: 'Procesando',
            completed: 'Completado',
            failed: 'Fallido',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Historial de Certificados
                    </h2>
                    <Link
                        href={route('certificates.generate-page')}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Generar Nuevos
                    </Link>
                </div>
            }
        >
            <Head title="Historial de Certificados" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {batches.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-500">
                                        No hay certificados generados aún.
                                    </p>
                                    <Link
                                        href={route('certificates.generate-page')}
                                        className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                    >
                                        Generar Certificados
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {batches.map((batch) => (
                                        <div
                                            key={batch.id}
                                            className={`border rounded-lg p-4 ${
                                                batch.status === 'processing' ? 'border-blue-300 bg-blue-50' :
                                                batch.status === 'failed' ? 'border-red-300 bg-red-50' :
                                                batch.status === 'completed' ? 'border-green-300 bg-green-50' :
                                                'border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Batch #{batch.id}
                                                        </h3>
                                                        {getStatusBadge(batch.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Plantilla: <span className="font-medium">{batch.template?.name || 'N/A'}</span>
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Creado: {formatDate(batch.created_at)}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-gray-900">
                                                        {batch.processed_certificates}/{batch.total_certificates}
                                                    </div>
                                                    <p className="text-xs text-gray-500">certificados</p>
                                                    {batch.failed_certificates > 0 && (
                                                        <p className="text-xs text-red-600">
                                                            {batch.failed_certificates} fallidos
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Barra de progreso para batches en proceso */}
                                            {(batch.status === 'processing' || batch.status === 'pending') && (
                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span className="text-blue-700">Procesando...</span>
                                                        <span className="text-blue-700">{batch.progress_percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${batch.progress_percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Acciones */}
                                            <div className="mt-4 flex items-center gap-2">
                                                {batch.status === 'completed' && batch.zip_file_url && (
                                                    <a
                                                        href={batch.zip_file_url}
                                                        download
                                                        className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Descargar ZIP
                                                    </a>
                                                )}
                                                <Link
                                                    href={route('certificates.batch-show', batch.id)}
                                                    className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200"
                                                >
                                                    Ver Detalles
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(batch.id)}
                                                    className="inline-flex items-center rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-200"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>

                                            {/* Mensaje de error */}
                                            {batch.status === 'failed' && batch.error_message && (
                                                <div className="mt-3 p-3 bg-red-100 rounded-md">
                                                    <p className="text-sm text-red-700">
                                                        <strong>Error:</strong> {batch.error_message}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

