import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function Configure({ template, google_fonts_api_key }) {
    const [selectedField, setSelectedField] = useState(null); // 'name' or 'cedula'
    const [positions, setPositions] = useState({
        name: {
            x: 0,
            y: 0,
            font_size: 16,
            font_family: 'Arial',
            font_color: '#000000',
            text_align_horizontal: 'left',
            text_align_vertical: 'top',
            center_automatically: false,
        },
        cedula: {
            x: 0,
            y: 0,
            font_size: 14,
            font_family: 'Arial',
            font_color: '#000000',
            text_align_horizontal: 'left',
            text_align_vertical: 'top',
            center_automatically: false,
            enabled: true,
        },
    });
    const [previewName, setPreviewName] = useState('Nombre de Ejemplo');
    const [previewCedula, setPreviewCedula] = useState('1234567890');
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const [fontSearchQuery, setFontSearchQuery] = useState('');
    const [fontSearchResults, setFontSearchResults] = useState([]);
    const [isSearchingFonts, setIsSearchingFonts] = useState(false);
    const [showFontResults, setShowFontResults] = useState(false);
    const fontSearchTimeoutRef = useRef(null);

    // Cargar posiciones existentes si existen
    useEffect(() => {
        if (template.positions && template.positions.length > 0) {
            const posMap = {};
            template.positions.forEach((pos) => {
                posMap[pos.field_type] = {
                    x: parseFloat(pos.x),
                    y: parseFloat(pos.y),
                    font_size: pos.font_size,
                    font_family: pos.font_family,
                    font_color: pos.font_color,
                    text_align_horizontal: pos.text_align_horizontal || 'left',
                    text_align_vertical: pos.text_align_vertical || 'top',
                    center_automatically: pos.center_automatically || false,
                    enabled: pos.enabled !== undefined ? pos.enabled : (pos.field_type === 'cedula' ? true : true),
                };
            });
            setPositions((prev) => ({ ...prev, ...posMap }));
        }
    }, [template.positions]);

    // Forzar re-render cuando la imagen se carga para calcular correctamente las posiciones
    const [imageLoaded, setImageLoaded] = useState(false);
    
    useEffect(() => {
        const imageEl = imageRef.current;
        if (imageEl) {
            const handleLoad = () => {
                setImageLoaded(true);
            };
            
            if (imageEl.complete) {
                setImageLoaded(true);
            } else {
                imageEl.addEventListener('load', handleLoad);
                return () => imageEl.removeEventListener('load', handleLoad);
            }
        }
    }, [template.file_url]);

    // Estado para rastrear fuentes cargadas
    const [fontsLoaded, setFontsLoaded] = useState(new Set());
    
    // Cargar fuentes de Google Fonts dinámicamente
    useEffect(() => {
        const fontsToLoad = new Set();
        if (positions.name.font_family) fontsToLoad.add(positions.name.font_family);
        if (positions.cedula.font_family) fontsToLoad.add(positions.cedula.font_family);
        
        const systemFonts = ['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia', 'Verdana', 'Tahoma'];
        const loadedLinks = [];
        const fontsToCheck = [];
        
        fontsToLoad.forEach((font) => {
            if (!systemFonts.includes(font)) {
                // Verificar si el link ya existe
                const existingLink = document.querySelector(`link[data-google-font="${font}"]`);
                if (!existingLink) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`;
                    link.setAttribute('data-google-font', font);
                    
                    // Esperar a que la fuente se cargue
                    link.onload = () => {
                        setFontsLoaded(prev => new Set([...prev, font]));
                    };
                    
                    // Si falla, también marcamos como cargada para evitar bloqueos
                    link.onerror = () => {
                        console.warn(`Error loading font: ${font}`);
                        setFontsLoaded(prev => new Set([...prev, font]));
                    };
                    
                    document.head.appendChild(link);
                    loadedLinks.push(link);
                    fontsToCheck.push(font);
                } else {
                    // Si ya existe, verificar si está cargada
                    fontsToCheck.push(font);
                }
            } else {
                // Fuentes del sistema se consideran cargadas inmediatamente
                setFontsLoaded(prev => new Set([...prev, font]));
            }
        });
        
        // Para fuentes que ya existen, verificar si están cargadas usando document.fonts
        if (document.fonts && document.fonts.check) {
            fontsToCheck.forEach(font => {
                // Verificar si la fuente está disponible
                if (document.fonts.check(`16px "${font}"`) || document.fonts.check(`16px ${font}`)) {
                    setFontsLoaded(prev => new Set([...prev, font]));
                } else {
                    // Esperar a que se cargue
                    document.fonts.ready.then(() => {
                        setFontsLoaded(prev => new Set([...prev, font]));
                    });
                }
            });
        } else {
            // Fallback: asumir que se cargarán después de un tiempo
            setTimeout(() => {
                fontsToCheck.forEach(font => {
                    setFontsLoaded(prev => new Set([...prev, font]));
                });
            }, 1000);
        }
    }, [positions.name.font_family, positions.cedula.font_family]);

    // Función helper para calcular coordenadas escaladas
    const getScaledPosition = (x, y) => {
        const imageEl = imageRef.current;
        if (!imageEl || !imageEl.naturalWidth) return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
        
        const naturalWidth = imageEl.naturalWidth || imageEl.width;
        const naturalHeight = imageEl.naturalHeight || imageEl.height;
        const displayWidth = imageEl.offsetWidth;
        const displayHeight = imageEl.offsetHeight;
        
        if (displayWidth === 0 || displayHeight === 0) return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
        
        const scaleX = displayWidth / naturalWidth;
        const scaleY = displayHeight / naturalHeight;
        
        return {
            x: x * scaleX,
            y: y * scaleY,
            scaleX,
            scaleY,
        };
    };

    const handleImageClick = (e) => {
        if (!selectedField || !containerRef.current || !imageRef.current) return;
        
        // Si el centrado automático está activado, solo actualizar Y
        if (positions[selectedField].center_automatically) {
            const imageRect = imageRef.current.getBoundingClientRect();
            const y = e.clientY - imageRect.top;
            const naturalHeight = imageRef.current.naturalHeight || imageRef.current.height;
            const scaleY = naturalHeight / imageRect.height;
            const realY = Math.round(y * scaleY);
            
            setPositions((prev) => ({
                ...prev,
                [selectedField]: {
                    ...prev[selectedField],
                    y: realY,
                },
            }));
            return;
        }

        const imageRect = imageRef.current.getBoundingClientRect();
        
        // Calcular la posición relativa a la imagen, no al contenedor
        const x = e.clientX - imageRect.left;
        const y = e.clientY - imageRect.top;
        
        // Obtener el tamaño natural de la imagen
        const naturalWidth = imageRef.current.naturalWidth || imageRef.current.width;
        const naturalHeight = imageRef.current.naturalHeight || imageRef.current.height;
        
        // Calcular el factor de escala entre la imagen mostrada y la imagen real
        const scaleX = naturalWidth / imageRect.width;
        const scaleY = naturalHeight / imageRect.height;
        
        // Convertir las coordenadas al tamaño real de la imagen
        const realX = Math.round(x * scaleX);
        const realY = Math.round(y * scaleY);

        setPositions((prev) => ({
            ...prev,
            [selectedField]: {
                ...prev[selectedField],
                x: realX,
                y: realY,
            },
        }));
    };

    const { data, setData, post, processing } = useForm({
        positions: positions,
    });

    useEffect(() => {
        setData('positions', positions);
    }, [positions]);

    // Buscar fuentes de Google Fonts
    useEffect(() => {
        if (fontSearchTimeoutRef.current) {
            clearTimeout(fontSearchTimeoutRef.current);
        }

        if (fontSearchQuery.length < 2) {
            setFontSearchResults([]);
            setShowFontResults(false);
            return;
        }

        setIsSearchingFonts(true);
        fontSearchTimeoutRef.current = setTimeout(() => {
            fetch(route('api.google-fonts.search', { q: fontSearchQuery }))
                .then((response) => response.json())
                .then((data) => {
                    setFontSearchResults(data.fonts || []);
                    setShowFontResults(true);
                    setIsSearchingFonts(false);
                })
                .catch((error) => {
                    console.error('Error searching fonts:', error);
                    setFontSearchResults([]);
                    setIsSearchingFonts(false);
                });
        }, 300); // Debounce de 300ms

        return () => {
            if (fontSearchTimeoutRef.current) {
                clearTimeout(fontSearchTimeoutRef.current);
            }
        };
    }, [fontSearchQuery]);

    const submit = (e) => {
        e.preventDefault();
        post(route('certificates.save-positions', template.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Configurar Posiciones - {template.name}
                    </h2>
                    <Link
                        href={route('templates.show', template.id)}
                        className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Configurar Posiciones" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Panel de Control */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Configuración
                                </h3>

                                <div className="mb-6">
                                    <p className="text-sm text-gray-600 mb-3">
                                        Selecciona qué campo quieres posicionar:
                                    </p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedField('name')}
                                            className={`w-full px-4 py-2 rounded-md text-sm font-semibold ${
                                                selectedField === 'name'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            Posicionar Nombre
                                        </button>
                                        <button
                                            onClick={() => setSelectedField('cedula')}
                                            className={`w-full px-4 py-2 rounded-md text-sm font-semibold ${
                                                selectedField === 'cedula'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            Posicionar Cédula
                                        </button>
                                    </div>
                                </div>

                                {selectedField && (
                                    <div className="mb-6 space-y-4 border-t pt-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tamaño de Fuente
                                            </label>
                                            <input
                                                type="number"
                                                min="8"
                                                max="72"
                                                value={positions[selectedField].font_size}
                                                onChange={(e) =>
                                                    setPositions((prev) => ({
                                                        ...prev,
                                                        [selectedField]: {
                                                            ...prev[selectedField],
                                                            font_size: parseInt(e.target.value),
                                                        },
                                                    }))
                                                }
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>

                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Familia de Fuente (Google Fonts)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={fontSearchQuery}
                                                    onChange={(e) => {
                                                        setFontSearchQuery(e.target.value);
                                                        setShowFontResults(true);
                                                    }}
                                                    onFocus={() => {
                                                        if (fontSearchResults.length > 0) {
                                                            setShowFontResults(true);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        // Delay para permitir clic en resultados
                                                        setTimeout(() => setShowFontResults(false), 200);
                                                    }}
                                                    placeholder="Buscar fuente de Google Fonts..."
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                                {isSearchingFonts && (
                                                    <div className="absolute right-2 top-2">
                                                        <svg
                                                            className="animate-spin h-5 w-5 text-gray-400"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Mostrar fuente actual seleccionada */}
                                            <div className="mt-2">
                                                <div className="text-xs text-gray-600">
                                                    Fuente actual:{' '}
                                                    <span
                                                        className="font-semibold"
                                                        style={{
                                                            fontFamily: positions[selectedField].font_family 
                                                                ? (positions[selectedField].font_family.includes(' ') 
                                                                    ? `"${positions[selectedField].font_family}"` 
                                                                    : positions[selectedField].font_family)
                                                                : 'Arial',
                                                        }}
                                                    >
                                                        {positions[selectedField].font_family || 'Arial'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Resultados de búsqueda */}
                                            {showFontResults && fontSearchResults.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {fontSearchResults.map((font, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => {
                                                                setPositions((prev) => ({
                                                                    ...prev,
                                                                    [selectedField]: {
                                                                        ...prev[selectedField],
                                                                        font_family: font.family,
                                                                    },
                                                                }));
                                                                setFontSearchQuery('');
                                                                setShowFontResults(false);
                                                            }}
                                                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                            style={{ fontFamily: font.family }}
                                                        >
                                                            <div className="font-semibold">{font.family}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {font.category}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Mensaje si no hay resultados */}
                                            {showFontResults &&
                                                !isSearchingFonts &&
                                                fontSearchQuery.length >= 2 &&
                                                fontSearchResults.length === 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
                                                        No se encontraron fuentes con ese nombre.
                                                    </div>
                                                )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Color de Fuente
                                            </label>
                                            <input
                                                type="color"
                                                value={positions[selectedField].font_color}
                                                onChange={(e) =>
                                                    setPositions((prev) => ({
                                                        ...prev,
                                                        [selectedField]: {
                                                            ...prev[selectedField],
                                                            font_color: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="block w-full h-10 rounded-md border-gray-300 shadow-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Alineación Horizontal
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPositions((prev) => ({
                                                            ...prev,
                                                            [selectedField]: {
                                                                ...prev[selectedField],
                                                                text_align_horizontal: 'left',
                                                            },
                                                        }))
                                                    }
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        positions[selectedField].text_align_horizontal === 'left'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Izquierda
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPositions((prev) => ({
                                                            ...prev,
                                                            [selectedField]: {
                                                                ...prev[selectedField],
                                                                text_align_horizontal: 'center',
                                                            },
                                                        }))
                                                    }
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        positions[selectedField].text_align_horizontal === 'center'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Centro
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPositions((prev) => ({
                                                            ...prev,
                                                            [selectedField]: {
                                                                ...prev[selectedField],
                                                                text_align_horizontal: 'right',
                                                            },
                                                        }))
                                                    }
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        positions[selectedField].text_align_horizontal === 'right'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Derecha
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Alineación Vertical
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPositions((prev) => ({
                                                            ...prev,
                                                            [selectedField]: {
                                                                ...prev[selectedField],
                                                                text_align_vertical: 'top',
                                                            },
                                                        }))
                                                    }
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        positions[selectedField].text_align_vertical === 'top'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Arriba
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPositions((prev) => ({
                                                            ...prev,
                                                            [selectedField]: {
                                                                ...prev[selectedField],
                                                                text_align_vertical: 'middle',
                                                            },
                                                        }))
                                                    }
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        positions[selectedField].text_align_vertical === 'middle'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Centro
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPositions((prev) => ({
                                                            ...prev,
                                                            [selectedField]: {
                                                                ...prev[selectedField],
                                                                text_align_vertical: 'bottom',
                                                            },
                                                        }))
                                                    }
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        positions[selectedField].text_align_vertical === 'bottom'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Abajo
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="center_automatically"
                                                checked={positions[selectedField].center_automatically}
                                                onChange={(e) =>
                                                    setPositions((prev) => ({
                                                        ...prev,
                                                        [selectedField]: {
                                                            ...prev[selectedField],
                                                            center_automatically: e.target.checked,
                                                            // Si se activa el centrado automático, desactivar alineación horizontal manual
                                                            text_align_horizontal: e.target.checked ? 'center' : prev[selectedField].text_align_horizontal,
                                                        },
                                                    }))
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label
                                                htmlFor="center_automatically"
                                                className="ml-2 block text-sm text-gray-700"
                                            >
                                                Centrar automáticamente (X variable)
                                            </label>
                                        </div>

                                        {/* Checkbox para habilitar/deshabilitar cédula - solo para campo cedula */}
                                        {selectedField === 'cedula' && (
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="cedula_enabled"
                                                    checked={positions.cedula.enabled}
                                                    onChange={(e) =>
                                                        setPositions((prev) => ({
                                                            ...prev,
                                                            cedula: {
                                                                ...prev.cedula,
                                                                enabled: e.target.checked,
                                                            },
                                                        }))
                                                    }
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <label
                                                    htmlFor="cedula_enabled"
                                                    className="ml-2 block text-sm text-gray-700"
                                                >
                                                    Habilitar cédula
                                                </label>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Texto de Vista Previa
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    selectedField === 'name'
                                                        ? previewName
                                                        : previewCedula
                                                }
                                                onChange={(e) =>
                                                    selectedField === 'name'
                                                        ? setPreviewName(e.target.value)
                                                        : setPreviewCedula(e.target.value)
                                                }
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={submit}>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {processing ? 'Guardando...' : 'Guardar Posiciones'}
                                    </button>
                                </form>

                                <div className="mt-4 text-xs text-gray-500">
                                    <p>
                                        <strong>Instrucciones:</strong>
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 mt-2">
                                        <li>Selecciona el campo a posicionar</li>
                                        <li>Haz clic en el diseño donde quieres el texto</li>
                                        <li>Ajusta el tamaño y estilo de fuente</li>
                                        <li>Guarda las posiciones</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Vista Previa del Diseño */}
                        <div className="lg:col-span-2">
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Vista Previa
                                </h3>
                                <div
                                    ref={containerRef}
                                    className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                                    onClick={handleImageClick}
                                    style={{ cursor: selectedField ? 'crosshair' : 'default' }}
                                >
                                    <img
                                        ref={imageRef}
                                        src={template.file_url}
                                        alt={template.name}
                                        className="max-w-full h-auto"
                                        draggable={false}
                                        onLoad={() => setImageLoaded(true)}
                                    />

                                    {/* Indicador de posición del nombre */}
                                    {positions.name.y > 0 && (() => {
                                        const imageEl = imageRef.current;
                                        if (!imageEl) return null;
                                        
                                        const containerWidth = imageEl.offsetWidth;
                                        const containerHeight = imageEl.offsetHeight;
                                        
                                        // Calcular escala
                                        const naturalWidth = imageEl.naturalWidth || imageEl.width;
                                        const naturalHeight = imageEl.naturalHeight || imageEl.height;
                                        
                                        if (containerWidth === 0 || containerHeight === 0 || naturalWidth === 0 || naturalHeight === 0) {
                                            return null;
                                        }
                                        
                                        const scaleX = containerWidth / naturalWidth;
                                        const scaleY = containerHeight / naturalHeight;
                                        
                                        // Calcular posición Y escalada
                                        const yScaled = positions.name.y * scaleY;
                                        
                                        // Calcular posición X
                                        let left;
                                        if (positions.name.center_automatically) {
                                            // Centrar automáticamente en el contenedor
                                            left = containerWidth / 2;
                                        } else {
                                            // Usar posición X escalada
                                            const xScaled = positions.name.x * scaleX;
                                            // Aplicar alineación horizontal
                                            const textWidth = positions.name.font_size * scaleX * 0.6 * previewName.length;
                                            if (positions.name.text_align_horizontal === 'center') {
                                                left = xScaled - (textWidth / 2);
                                            } else if (positions.name.text_align_horizontal === 'right') {
                                                left = xScaled - textWidth;
                                            } else {
                                                left = xScaled;
                                            }
                                        }
                                        
                                        const transforms = [];
                                        if (positions.name.center_automatically) {
                                            transforms.push('translateX(-50%)');
                                        }
                                        if (positions.name.text_align_vertical === 'middle') {
                                            transforms.push('translateY(-50%)');
                                        } else if (positions.name.text_align_vertical === 'bottom') {
                                            transforms.push('translateY(-100%)');
                                        }
                                        
                                        // Asegurar que el fontFamily tenga comillas si contiene espacios y agregar fallback
                                        const fontFamilyValue = positions.name.font_family || 'Arial';
                                        const fontFamily = fontFamilyValue.includes(' ') 
                                            ? `"${fontFamilyValue}", sans-serif` 
                                            : `${fontFamilyValue}, sans-serif`;
                                        
                                        const styles = {
                                            position: 'absolute',
                                            left: `${left}px`,
                                            top: `${yScaled}px`,
                                            fontSize: `${positions.name.font_size * scaleX}px`,
                                            fontFamily: fontFamily,
                                            color: positions.name.font_color || '#000000',
                                            pointerEvents: 'none',
                                            border: selectedField === 'name' ? '2px solid #4F46E5' : '1px solid #9CA3AF',
                                            textAlign: positions.name.center_automatically ? 'center' : (positions.name.text_align_horizontal || 'left'),
                                            transform: transforms.length > 0 ? transforms.join(' ') : 'none',
                                            whiteSpace: 'nowrap',
                                        };
                                        
                                        return (
                                            <div style={styles}>
                                                {previewName}
                                            </div>
                                        );
                                    })()}

                                    {/* Indicador de posición de la cédula - solo si está habilitada */}
                                    {positions.cedula.enabled && positions.cedula.y > 0 && (() => {
                                        const imageEl = imageRef.current;
                                        if (!imageEl) return null;
                                        
                                        const containerWidth = imageEl.offsetWidth;
                                        const containerHeight = imageEl.offsetHeight;
                                        
                                        // Calcular escala
                                        const naturalWidth = imageEl.naturalWidth || imageEl.width;
                                        const naturalHeight = imageEl.naturalHeight || imageEl.height;
                                        
                                        if (containerWidth === 0 || containerHeight === 0 || naturalWidth === 0 || naturalHeight === 0) {
                                            return null;
                                        }
                                        
                                        const scaleX = containerWidth / naturalWidth;
                                        const scaleY = containerHeight / naturalHeight;
                                        
                                        // Calcular posición Y escalada
                                        const yScaled = positions.cedula.y * scaleY;
                                        
                                        // Calcular posición X
                                        let left;
                                        if (positions.cedula.center_automatically) {
                                            // Centrar automáticamente en el contenedor
                                            left = containerWidth / 2;
                                        } else {
                                            // Usar posición X escalada
                                            const xScaled = positions.cedula.x * scaleX;
                                            // Aplicar alineación horizontal
                                            const textWidth = positions.cedula.font_size * scaleX * 0.6 * previewCedula.length;
                                            if (positions.cedula.text_align_horizontal === 'center') {
                                                left = xScaled - (textWidth / 2);
                                            } else if (positions.cedula.text_align_horizontal === 'right') {
                                                left = xScaled - textWidth;
                                            } else {
                                                left = xScaled;
                                            }
                                        }
                                        
                                        const transforms = [];
                                        if (positions.cedula.center_automatically) {
                                            transforms.push('translateX(-50%)');
                                        }
                                        if (positions.cedula.text_align_vertical === 'middle') {
                                            transforms.push('translateY(-50%)');
                                        } else if (positions.cedula.text_align_vertical === 'bottom') {
                                            transforms.push('translateY(-100%)');
                                        }
                                        
                                        // Asegurar que el fontFamily tenga comillas si contiene espacios y agregar fallback
                                        const fontFamilyValue = positions.cedula.font_family || 'Arial';
                                        const fontFamily = fontFamilyValue.includes(' ') 
                                            ? `"${fontFamilyValue}", sans-serif` 
                                            : `${fontFamilyValue}, sans-serif`;
                                        
                                        const styles = {
                                            position: 'absolute',
                                            left: `${left}px`,
                                            top: `${yScaled}px`,
                                            fontSize: `${positions.cedula.font_size * scaleX}px`,
                                            fontFamily: fontFamily,
                                            color: positions.cedula.font_color || '#000000',
                                            pointerEvents: 'none',
                                            border: selectedField === 'cedula' ? '2px solid #4F46E5' : '1px solid #9CA3AF',
                                            textAlign: positions.cedula.center_automatically ? 'center' : (positions.cedula.text_align_horizontal || 'left'),
                                            transform: transforms.length > 0 ? transforms.join(' ') : 'none',
                                            whiteSpace: 'nowrap',
                                        };
                                        
                                        return (
                                            <div style={styles}>
                                                {previewCedula}
                                            </div>
                                        );
                                    })()}

                                    {/* Marcador de posición cuando se selecciona un campo */}
                                    {selectedField && positions[selectedField].x > 0 && positions[selectedField].y > 0 && (() => {
                                        const scaled = getScaledPosition(positions[selectedField].x, positions[selectedField].y);
                                        if (!scaled.scaleX) return null;
                                        
                                        return (
                                            <div
                                                className="absolute pointer-events-none"
                                                style={{
                                                    left: `${scaled.x}px`,
                                                    top: `${scaled.y}px`,
                                                    transform: 'translate(-50%, -50%)',
                                                    width: '20px',
                                                    height: '20px',
                                                    border: '2px solid #4F46E5',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                                                }}
                                            />
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

