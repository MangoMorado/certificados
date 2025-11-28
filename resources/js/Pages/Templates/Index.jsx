import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ templates }) {
    const handleDelete = (id, name) => {
        if (confirm(`¿Estás seguro de eliminar el diseño "${name}"? Esta acción no se puede deshacer.`)) {
            router.delete(route('templates.destroy', id));
        }
    };
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Diseños de Certificados
                    </h2>
                    <Link
                        href={route('templates.create')}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Nuevo Diseño
                    </Link>
                </div>
            }
        >
            <Head title="Diseños de Certificados" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {templates.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">No hay diseños creados aún.</p>
                                    <Link
                                        href={route('templates.create')}
                                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                    >
                                        Crear Primer Diseño
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                {template.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Tipo: {template.file_type.toUpperCase()}
                                            </p>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={route('templates.show', template.id)}
                                                    className="flex-1 text-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                                >
                                                    Ver
                                                </Link>
                                                <Link
                                                    href={route('templates.edit', template.id)}
                                                    className="flex-1 text-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(template.id, template.name)}
                                                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    title="Eliminar diseño"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
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

