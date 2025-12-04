import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Edit({ person, attribute_keys = [] }) {
    // Inicializar attributes desde la persona
    const initialAttributes = {};
    attribute_keys.forEach(key => {
        initialAttributes[key] = person.attributes?.[key] || '';
    });

    const { data, setData, put, processing, errors } = useForm({
        name: person.name || '',
        cedula: person.cedula || '',
        attributes: initialAttributes,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('people.update', person.id));
    };

    // Formatear nombre de atributo para mostrar
    const formatAttributeName = (key) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Actualizar un atributo específico
    const updateAttribute = (key, value) => {
        setData('attributes', {
            ...data.attributes,
            [key]: value,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Editar Persona
                </h2>
            }
        >
            <Head title="Editar Persona" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="mb-4">
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Nombre
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label
                                    htmlFor="cedula"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Cédula
                                </label>
                                <input
                                    id="cedula"
                                    type="text"
                                    value={data.cedula}
                                    onChange={(e) => setData('cedula', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Opcional"
                                />
                                {errors.cedula && (
                                    <p className="mt-1 text-sm text-red-600">{errors.cedula}</p>
                                )}
                            </div>

                            {/* Campos de atributos personalizados */}
                            {attribute_keys.length > 0 && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h3 className="text-sm font-medium text-green-800 mb-3">
                                        Atributos Personalizados
                                    </h3>
                                    <div className="space-y-3">
                                        {attribute_keys.map((key) => (
                                            <div key={key}>
                                                <label
                                                    htmlFor={`attr-${key}`}
                                                    className="block text-sm font-medium text-green-700"
                                                >
                                                    {formatAttributeName(key)}
                                                </label>
                                                <input
                                                    id={`attr-${key}`}
                                                    type="text"
                                                    value={data.attributes[key] || ''}
                                                    onChange={(e) => updateAttribute(key, e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white"
                                                    placeholder={`Ingresa ${formatAttributeName(key).toLowerCase()}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-4">
                                <Link
                                    href={route('people.index')}
                                    className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

