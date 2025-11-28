import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Show({ template }) {
    const handleDelete = () => {
        if (confirm(`¿Estás seguro de eliminar el diseño "${template.name}"? Esta acción no se puede deshacer y también eliminará todas las posiciones configuradas.`)) {
            router.delete(route('templates.destroy', template.id));
        }
    };
    const hasPositions = template.positions && template.positions.length > 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {template.name}
                    </h2>
                    <div className="flex gap-2">
                        <Link
                            href={route('templates.edit', template.id)}
                            className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
                        >
                            Editar
                        </Link>
                        <Link
                            href={route('certificates.configure', template.id)}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            Configurar Posiciones
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={template.name} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Información del Diseño
                                </h3>
                                <p className="text-sm text-gray-600">
                                    <strong>Tipo:</strong> {template.file_type.toUpperCase()}
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Vista Previa
                                </h3>
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <img
                                        src={template.file_url}
                                        alt={template.name}
                                        className="max-w-full h-auto"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Posiciones Configuradas
                                </h3>
                                {hasPositions ? (
                                    <div className="space-y-2">
                                        {template.positions.map((position) => (
                                            <div
                                                key={position.id}
                                                className="border border-gray-200 rounded-lg p-3"
                                            >
                                                <p className="text-sm">
                                                    <strong>Tipo:</strong>{' '}
                                                    {position.field_type === 'name'
                                                        ? 'Nombre'
                                                        : 'Cédula'}
                                                </p>
                                                <p className="text-sm">
                                                    <strong>Posición:</strong> X: {position.x}, Y:{' '}
                                                    {position.y}
                                                </p>
                                                <p className="text-sm">
                                                    <strong>Fuente:</strong> {position.font_family}{' '}
                                                    {position.font_size}px
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800">
                                            No se han configurado las posiciones aún. Haz clic en
                                            "Configurar Posiciones" para definir dónde se colocarán
                                            el nombre y la cédula.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Link
                                    href={route('templates.index')}
                                    className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                                >
                                    Volver
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

