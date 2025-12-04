import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Generate({ templates = [], people = [] }) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedPeople, setSelectedPeople] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [generatedFiles, setGeneratedFiles] = useState([]);
    const [asyncMessage, setAsyncMessage] = useState(null);
    const [batchId, setBatchId] = useState(null);

    const togglePerson = (personId) => {
        setSelectedPeople((prev) =>
            prev.includes(personId)
                ? prev.filter((id) => id !== personId)
                : [...prev, personId],
        );
    };

    const selectAll = () => {
        if (selectedPeople.length === (people?.length || 0)) {
            setSelectedPeople([]);
        } else {
            setSelectedPeople((people || []).map((p) => p.id));
        }
    };

    const handleGenerate = async () => {
        if (!selectedTemplate || selectedPeople.length === 0) {
            alert('Por favor selecciona un diseño y al menos una persona');
            return;
        }

        setGenerating(true);
        setAsyncMessage(null);
        setBatchId(null);
        try {
            const response = await axios.post(route('certificates.generate'), {
                template_id: selectedTemplate,
                person_ids: selectedPeople,
            });

            if (response.data.async) {
                // Procesamiento asíncrono
                setAsyncMessage(response.data.message);
                setBatchId(response.data.batch_id);
                setGeneratedFiles([]);
            } else {
                // Procesamiento síncrono (pocos certificados)
                setGeneratedFiles(response.data.files || []);
            }
        } catch (error) {
            alert('Error al generar certificados: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Generar Certificados
                </h2>
            }
        >
            <Head title="Generar Certificados" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Panel de Selección */}
                        <div className="space-y-6">
                            {/* Selección de Diseño */}
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Seleccionar Diseño
                                </h3>
                                {(templates?.length || 0) === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 mb-2">
                                            No hay diseños disponibles.
                                        </p>
                                        <Link
                                            href={route('templates.create')}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Crear un diseño
                                        </Link>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedTemplate || ''}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecciona un diseño</option>
                                        {(templates || []).map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Selección de Personas */}
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Seleccionar Personas
                                    </h3>
                                    <button
                                        onClick={selectAll}
                                        className="text-sm text-indigo-600 hover:text-indigo-900"
                                    >
                                        {selectedPeople.length === (people?.length || 0)
                                            ? 'Deseleccionar Todo'
                                            : 'Seleccionar Todo'}
                                    </button>
                                </div>
                                {(people?.length || 0) === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 mb-2">
                                            No hay personas registradas.
                                        </p>
                                        <Link
                                            href={route('people.create')}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Agregar personas
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto space-y-2">
                                        {(people || []).map((person) => (
                                            <label
                                                key={person.id}
                                                className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPeople.includes(person.id)}
                                                    onChange={() => togglePerson(person.id)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="ml-3 text-sm text-gray-900">
                                                    {person.name} - {person.cedula}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botón de Generación */}
                            <button
                                onClick={handleGenerate}
                                disabled={
                                    !selectedTemplate ||
                                    selectedPeople.length === 0 ||
                                    generating
                                }
                                className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating
                                    ? 'Generando Certificados...'
                                    : `Generar ${selectedPeople.length} Certificado(s)`}
                            </button>
                        </div>

                        {/* Resultados */}
                        <div className="bg-white shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Certificados Generados
                            </h3>
                            
                            {/* Mensaje de procesamiento asíncrono */}
                            {asyncMessage && (
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm text-blue-700">{asyncMessage}</p>
                                            {batchId && (
                                                <Link
                                                    href={route('certificates.batch-show', batchId)}
                                                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Ver progreso
                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(generatedFiles?.length || 0) === 0 && !asyncMessage ? (
                                <p className="text-gray-500 text-center py-8">
                                    Los certificados generados aparecerán aquí
                                </p>
                            ) : (generatedFiles?.length || 0) > 0 ? (
                                <div className="space-y-2">
                                    {(generatedFiles || []).map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {file.person?.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {file.person?.cedula}
                                                </p>
                                            </div>
                                            <a
                                                href={file.file_url}
                                                download={file.file_name}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                            >
                                                Descargar
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

