import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function BatchDetail({ batch }) {
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
                        Detalle del Batch #{batch.id}
                    </h2>
                    <Link
                        href={route('certificates.history')}
                        className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title={`Batch #${batch.id}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Información del Batch */}
                    <div className="bg-white shadow-sm sm:rounded-lg p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Estado</p>
                                <div className="mt-1">{getStatusBadge(batch.status)}</div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Plantilla</p>
                                <p className="font-medium">{batch.template?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Progreso</p>
                                <p className="font-medium">
                                    {batch.processed_certificates}/{batch.total_certificates} ({batch.progress_percentage}%)
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fallidos</p>
                                <p className={`font-medium ${batch.failed_certificates > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {batch.failed_certificates}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Creado</p>
                                <p className="font-medium">{formatDate(batch.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Iniciado</p>
                                <p className="font-medium">{formatDate(batch.started_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Completado</p>
                                <p className="font-medium">{formatDate(batch.completed_at)}</p>
                            </div>
                            <div>
                                {batch.zip_file_url && (
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
                            </div>
                        </div>

                        {batch.error_message && (
                            <div className="mt-4 p-3 bg-red-100 rounded-md">
                                <p className="text-sm text-red-700">
                                    <strong>Error:</strong> {batch.error_message}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Lista de Certificados */}
                    <div className="bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Certificados ({batch.items?.length || 0})
                        </h3>

                        {batch.items && batch.items.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Persona
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cédula
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {batch.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.person?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.person?.cedula || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(item.status)}
                                                    {item.error_message && (
                                                        <p className="text-xs text-red-600 mt-1">{item.error_message}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {item.status === 'completed' && item.file_url && (
                                                        <a
                                                            href={item.file_url}
                                                            download
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Descargar
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                No hay certificados en este batch.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

