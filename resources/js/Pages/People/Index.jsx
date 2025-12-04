import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function Index({ people, attribute_keys = [] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar esta persona?')) {
            router.delete(route('people.destroy', id));
        }
    };

    // Formatear nombre de atributo para mostrar (capitalizar y reemplazar guiones bajos)
    const formatAttributeName = (key) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Obtener valor de atributo de una persona
    const getAttributeValue = (person, key) => {
        if (person.attributes && typeof person.attributes === 'object') {
            return person.attributes[key] || '';
        }
        return '';
    };

    // Filtrar personas en tiempo real
    const filteredPeople = useMemo(() => {
        if (!searchTerm.trim()) {
            return people;
        }

        const term = searchTerm.toLowerCase().trim();
        
        return people.filter((person) => {
            // Buscar en nombre
            if (person.name?.toLowerCase().includes(term)) {
                return true;
            }
            
            // Buscar en cédula
            if (person.cedula?.toLowerCase().includes(term)) {
                return true;
            }
            
            // Buscar en atributos
            if (person.attributes && typeof person.attributes === 'object') {
                for (const key of Object.keys(person.attributes)) {
                    const value = person.attributes[key];
                    if (value && value.toString().toLowerCase().includes(term)) {
                        return true;
                    }
                }
            }
            
            return false;
        });
    }, [people, searchTerm]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Personas a Certificar
                    </h2>
                    <Link
                        href={route('people.create')}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Agregar Persona
                    </Link>
                </div>
            }
        >
            <Head title="Personas a Certificar" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Buscador dinámico */}
                            <div className="mb-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por nombre, cédula o cualquier atributo..."
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                {searchTerm && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Mostrando {filteredPeople.length} de {people.length} persona(s)
                                    </p>
                                )}
                            </div>

                            {people.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">
                                        No hay personas registradas aún.
                                    </p>
                                    <Link
                                        href={route('people.create')}
                                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                    >
                                        Agregar Primera Persona
                                    </Link>
                                </div>
                            ) : filteredPeople.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">
                                        No se encontraron resultados para "{searchTerm}"
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200"
                                    >
                                        Limpiar búsqueda
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Nombre
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cédula
                                                </th>
                                                {/* Columnas dinámicas para atributos */}
                                                {attribute_keys.map((key) => (
                                                    <th
                                                        key={key}
                                                        className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider bg-green-50"
                                                    >
                                                        {formatAttributeName(key)}
                                                    </th>
                                                ))}
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredPeople.map((person) => (
                                                <tr key={person.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {person.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {person.cedula || <span className="text-gray-300 italic">—</span>}
                                                    </td>
                                                    {/* Valores dinámicos de atributos */}
                                                    {attribute_keys.map((key) => (
                                                        <td
                                                            key={key}
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-green-700 bg-green-50/50"
                                                        >
                                                            {getAttributeValue(person, key) || (
                                                                <span className="text-gray-300 italic">—</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={route('people.edit', person.id)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(person.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

