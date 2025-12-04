import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ images }) {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        image: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('gallery.store'), {
            onSuccess: () => {
                reset();
                setPreviewUrl(null);
            },
            forceFormData: true,
        });
    };

    const handleDelete = (id, name) => {
        if (confirm(`¿Estás seguro de eliminar la imagen "${name}"?`)) {
            router.delete(route('gallery.destroy', id));
        }
    };

    // Filtrar imágenes por búsqueda
    const filteredImages = images.filter((img) =>
        img.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Galería de Imágenes
                    </h2>
                    <span className="text-sm text-gray-500">
                        {images.length} imagen(es) en la galería
                    </span>
                </div>
            }
        >
            <Head title="Galería de Imágenes" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Panel de subida */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Subir Nueva Imagen
                                </h3>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre identificador
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value.toLowerCase())}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                                            placeholder="Ej: valiente, creativo, curioso"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            Este nombre debe coincidir con el valor del atributo "imagen" en el CSV.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Imagen
                                        </label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-amber-400 transition-colors">
                                            <div className="space-y-1 text-center">
                                                {previewUrl ? (
                                                    <div className="mb-3">
                                                        <img
                                                            src={previewUrl}
                                                            alt="Preview"
                                                            className="mx-auto h-32 w-auto object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <svg
                                                        className="mx-auto h-12 w-12 text-gray-400"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        viewBox="0 0 48 48"
                                                    >
                                                        <path
                                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                            strokeWidth={2}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                )}
                                                <div className="flex text-sm text-gray-600 justify-center">
                                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none">
                                                        <span>Seleccionar archivo</span>
                                                        <input
                                                            type="file"
                                                            className="sr-only"
                                                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                                            onChange={handleFileChange}
                                                        />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    PNG, JPG, GIF, WEBP hasta 5MB
                                                </p>
                                            </div>
                                        </div>
                                        {errors.image && (
                                            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing || !data.name || !data.image}
                                        className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Subiendo...' : 'Subir Imagen'}
                                    </button>
                                </form>

                                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <h4 className="text-sm font-semibold text-amber-800 mb-2">
                                        💡 ¿Cómo usar las imágenes?
                                    </h4>
                                    <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                                        <li>Sube una imagen con un nombre (ej: "valiente")</li>
                                        <li>En tu CSV agrega una columna "imagen"</li>
                                        <li>El valor debe coincidir con el nombre (ej: "valiente")</li>
                                        <li>En la plantilla, agrega un campo "Imagen" y selecciona el atributo "imagen"</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Listado de imágenes */}
                        <div className="lg:col-span-2">
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Imágenes Disponibles
                                    </h3>
                                </div>

                                {/* Buscador */}
                                <div className="mb-4">
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
                                            placeholder="Buscar por nombre..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                {filteredImages.length === 0 ? (
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
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-500">
                                            {searchTerm ? 'No se encontraron imágenes.' : 'No hay imágenes en la galería.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {filteredImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className="group relative bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-amber-400 transition-colors"
                                            >
                                                <div className="aspect-square">
                                                    <img
                                                        src={image.file_url}
                                                        alt={image.name}
                                                        className="w-full h-full object-contain p-2"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <button
                                                        onClick={() => handleDelete(image.id, image.name)}
                                                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                                                        title="Eliminar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="p-2 bg-white border-t">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {image.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {image.width}x{image.height}px
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

