import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link
                            href={route('templates.index')}
                            className="block overflow-hidden bg-white shadow-sm sm:rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Diseños de Certificados
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Gestiona los diseños de certificados (SVG o PDF)
                                </p>
                            </div>
                        </Link>

                        <Link
                            href={route('people.index')}
                            className="block overflow-hidden bg-white shadow-sm sm:rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Personas a Certificar
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Agrega y gestiona las personas que recibirán certificados
                                </p>
                            </div>
                        </Link>

                        <Link
                            href={route('certificates.generate-page')}
                            className="block overflow-hidden bg-white shadow-sm sm:rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Generar Certificados
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Genera certificados en PDF para las personas seleccionadas
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
