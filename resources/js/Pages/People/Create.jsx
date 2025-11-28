import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Create() {
    const [mode, setMode] = useState('single'); // 'single' or 'bulk'

    const singleForm = useForm({
        name: '',
        cedula: '',
    });

    const bulkForm = useForm({
        bulk_text: '',
    });

    const submitSingle = (e) => {
        e.preventDefault();
        singleForm.post(route('people.store'));
    };

    const submitBulk = (e) => {
        e.preventDefault();
        bulkForm.post(route('people.store-bulk'));
    };

    // Contar líneas válidas para mostrar en el botón
    const countValidLines = () => {
        if (!bulkForm.data.bulk_text) return 0;
        const lines = bulkForm.data.bulk_text.split('\n').filter(line => line.trim());
        return lines.length;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Agregar Personas
                </h2>
            }
        >
            <Head title="Agregar Personas" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setMode('single')}
                            className={`px-4 py-2 rounded-md text-sm font-semibold ${
                                mode === 'single'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            Individual
                        </button>
                        <button
                            onClick={() => setMode('bulk')}
                            className={`px-4 py-2 rounded-md text-sm font-semibold ${
                                mode === 'bulk'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            Masivo
                        </button>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        {mode === 'single' ? (
                            <form onSubmit={submitSingle} className="p-6">
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
                                        value={singleForm.data.name}
                                        onChange={(e) =>
                                            singleForm.setData('name', e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                    {singleForm.errors.name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {singleForm.errors.name}
                                        </p>
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
                                        value={singleForm.data.cedula}
                                        onChange={(e) =>
                                            singleForm.setData('cedula', e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                    {singleForm.errors.cedula && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {singleForm.errors.cedula}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <Link
                                        href={route('people.index')}
                                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={singleForm.processing}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {singleForm.processing ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={submitBulk} className="p-6">
                                <div className="mb-4">
                                    <label
                                        htmlFor="bulk_text"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Personas (una por línea)
                                    </label>
                                    <textarea
                                        id="bulk_text"
                                        rows={15}
                                        value={bulkForm.data.bulk_text}
                                        onChange={(e) =>
                                            bulkForm.setData('bulk_text', e.target.value)
                                        }
                                        placeholder="Formato: Nombre, Cédula&#10;Ejemplo:&#10;Juan Pérez, 1234567890&#10;María González, 0987654321&#10;Carlos Rodríguez, 1122334455"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
                                        required
                                    />
                                    {bulkForm.errors.bulk_text && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {bulkForm.errors.bulk_text}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">
                                        <strong>Formato:</strong> Cada línea debe contener "Nombre, Cédula" separados por coma.
                                        <br />
                                        Se detectarán automáticamente {countValidLines()} persona(s) válida(s).
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <Link
                                        href={route('people.index')}
                                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={bulkForm.processing || countValidLines() === 0}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {bulkForm.processing
                                            ? 'Guardando...'
                                            : `Guardar ${countValidLines()} Persona(s)`}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

