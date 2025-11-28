import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Index({ google_fonts_api_key }) {
    const { data, setData, post, processing, errors } = useForm({
        google_fonts_api_key: google_fonts_api_key || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Configuración
                </h2>
            }
        >
            <Head title="Configuración" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Google Fonts API
                            </h3>
                            
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="google_fonts_api_key"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        API Key de Google Fonts
                                    </label>
                                    <input
                                        id="google_fonts_api_key"
                                        type="text"
                                        value={data.google_fonts_api_key}
                                        onChange={(e) =>
                                            setData('google_fonts_api_key', e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Ingresa tu API Key de Google Fonts"
                                    />
                                    {errors.google_fonts_api_key && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.google_fonts_api_key}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">
                                        Obtén tu API Key en:{' '}
                                        <a
                                            href="https://developers.google.com/fonts/docs/developer_api"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Google Fonts Developer API
                                        </a>
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        <strong>Nota:</strong> La API Key es opcional. Si no la proporcionas,
                                        se usarán las fuentes disponibles públicamente de Google Fonts.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                                    >
                                        {processing ? 'Guardando...' : 'Guardar Configuración'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

