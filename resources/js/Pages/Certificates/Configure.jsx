import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function Configure({ template, google_fonts_api_key, available_attributes = [] }) {
    const [selectedField, setSelectedField] = useState(null); // 'name', 'cedula', or 'label-{index}'
    const [positions, setPositions] = useState({
        name: {
            x: 0,
            y: 0,
            font_size: 16,
            font_family: 'Arial',
            font_weight: '400',
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
            font_weight: '400',
            font_color: '#000000',
            text_align_horizontal: 'left',
            text_align_vertical: 'top',
            center_automatically: false,
            enabled: true,
        },
    });

    // Opciones de peso de fuente
    const fontWeightOptions = [
        { value: '100', label: 'Thin (100)' },
        { value: '200', label: 'Extra Light (200)' },
        { value: '300', label: 'Light (300)' },
        { value: '400', label: 'Regular (400)' },
        { value: '500', label: 'Medium (500)' },
        { value: '600', label: 'Semi Bold (600)' },
        { value: '700', label: 'Bold (700)' },
        { value: '800', label: 'Extra Bold (800)' },
        { value: '900', label: 'Black (900)' },
    ];
    const [labels, setLabels] = useState([]);
    const [images, setImages] = useState([]); // Campo para imágenes dinámicas
    const [galleryImages, setGalleryImages] = useState([]); // Imágenes disponibles en galería
    const [previewName, setPreviewName] = useState('Nombre de Ejemplo');
    const [previewCedula, setPreviewCedula] = useState('1234567890');
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const [fontSearchQuery, setFontSearchQuery] = useState('');
    const [fontSearchResults, setFontSearchResults] = useState([]);
    const [isSearchingFonts, setIsSearchingFonts] = useState(false);
    const [showFontResults, setShowFontResults] = useState(false);
    const fontSearchTimeoutRef = useRef(null);

    // Cargar imágenes de la galería
    useEffect(() => {
        fetch(route('api.gallery.images'))
            .then(res => res.json())
            .then(data => setGalleryImages(data.images || []))
            .catch(err => console.error('Error loading gallery images:', err));
    }, []);

    // Cargar posiciones existentes si existen
    useEffect(() => {
        if (template.positions && template.positions.length > 0) {
            const posMap = {};
            const loadedLabels = [];
            const loadedImages = [];
            
            template.positions.forEach((pos) => {
                if (pos.field_type === 'label') {
                    loadedLabels.push({
                        id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        label_text: pos.label_text || '',
                        attribute_key: pos.attribute_key || '',
                        prefix: pos.prefix || '',
                        prefix_font_size: pos.prefix_font_size || null,
                        x: parseFloat(pos.x),
                        y: parseFloat(pos.y),
                        font_size: pos.font_size,
                        font_family: pos.font_family,
                        font_weight: pos.font_weight || '400',
                        font_color: pos.font_color,
                        text_align_horizontal: pos.text_align_horizontal || 'left',
                        text_align_vertical: pos.text_align_vertical || 'top',
                        center_automatically: pos.center_automatically || false,
                        enabled: pos.enabled !== undefined ? pos.enabled : true,
                    });
                } else if (pos.field_type === 'image') {
                    loadedImages.push({
                        id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        attribute_key: pos.attribute_key || '',
                        x: parseFloat(pos.x),
                        y: parseFloat(pos.y),
                        image_width: pos.image_width || 100,
                        image_height: pos.image_height || 100,
                        center_automatically: pos.center_automatically || false,
                        enabled: pos.enabled !== undefined ? pos.enabled : true,
                    });
                } else {
                    posMap[pos.field_type] = {
                        x: parseFloat(pos.x),
                        y: parseFloat(pos.y),
                        font_size: pos.font_size,
                        font_family: pos.font_family,
                        font_weight: pos.font_weight || '400',
                        font_color: pos.font_color,
                        text_align_horizontal: pos.text_align_horizontal || 'left',
                        text_align_vertical: pos.text_align_vertical || 'top',
                        center_automatically: pos.center_automatically || false,
                        enabled: pos.enabled !== undefined ? pos.enabled : (pos.field_type === 'cedula' ? true : true),
                    };
                }
            });
            
            setPositions((prev) => ({ ...prev, ...posMap }));
            setLabels(loadedLabels);
            setImages(loadedImages);
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
        // Agregar fuentes de los labels
        labels.forEach(label => {
            if (label.font_family) fontsToLoad.add(label.font_family);
        });
        
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
                    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
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
    }, [positions.name.font_family, positions.cedula.font_family, labels]);

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

    // Helper para obtener el campo actual (puede ser positions, label o image)
    const getCurrentField = () => {
        if (!selectedField) return null;
        if (selectedField === 'name' || selectedField === 'cedula') {
            return positions[selectedField];
        }
        // Es un label
        const label = labels.find(l => l.id === selectedField);
        if (label) return label;
        // Es una imagen
        return images.find(i => i.id === selectedField);
    };

    // Verificar si el campo actual es una imagen
    const isCurrentFieldImage = () => {
        if (!selectedField) return false;
        return images.some(i => i.id === selectedField);
    };

    // Helper para actualizar el campo actual
    const updateCurrentField = (updates) => {
        if (!selectedField) return;
        if (selectedField === 'name' || selectedField === 'cedula') {
            setPositions(prev => ({
                ...prev,
                [selectedField]: {
                    ...prev[selectedField],
                    ...updates,
                },
            }));
        } else if (images.some(i => i.id === selectedField)) {
            // Es una imagen
            setImages(prev => prev.map(i => 
                i.id === selectedField ? { ...i, ...updates } : i
            ));
        } else {
            // Es un label
            setLabels(prev => prev.map(l => 
                l.id === selectedField ? { ...l, ...updates } : l
            ));
        }
    };

    const handleImageClick = (e) => {
        if (!selectedField || !containerRef.current || !imageRef.current) return;
        
        const currentField = getCurrentField();
        if (!currentField) return;

        const imageRect = imageRef.current.getBoundingClientRect();
        const naturalWidth = imageRef.current.naturalWidth || imageRef.current.width;
        const naturalHeight = imageRef.current.naturalHeight || imageRef.current.height;
        const scaleX = naturalWidth / imageRect.width;
        const scaleY = naturalHeight / imageRect.height;

        // Si el centrado automático está activado, solo actualizar Y
        if (currentField.center_automatically) {
            const y = e.clientY - imageRect.top;
            const realY = Math.round(y * scaleY);
            updateCurrentField({ y: realY });
            return;
        }

        // Calcular la posición relativa a la imagen
        const x = e.clientX - imageRect.left;
        const y = e.clientY - imageRect.top;
        
        // Convertir las coordenadas al tamaño real de la imagen
        const realX = Math.round(x * scaleX);
        const realY = Math.round(y * scaleY);

        updateCurrentField({ x: realX, y: realY });
    };

    // Agregar nuevo label
    const addLabel = () => {
        const newLabel = {
            id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label_text: '',
            attribute_key: '',
            prefix: '',
            prefix_font_size: null,
            x: 100,
            y: 100,
            font_size: 14,
            font_family: 'Arial',
            font_weight: '400',
            font_color: '#000000',
            text_align_horizontal: 'left',
            text_align_vertical: 'top',
            center_automatically: false,
            enabled: true,
        };
        setLabels(prev => [...prev, newLabel]);
        setSelectedField(newLabel.id);
    };

    // Eliminar label
    const removeLabel = (labelId) => {
        setLabels(prev => prev.filter(l => l.id !== labelId));
        if (selectedField === labelId) {
            setSelectedField(null);
        }
    };

    // Agregar nueva imagen
    const addImage = () => {
        const newImage = {
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            attribute_key: available_attributes.find(a => a.toLowerCase().includes('imagen')) || available_attributes[0] || '',
            x: 100,
            y: 100,
            image_width: 100,
            image_height: 100,
            center_automatically: false,
            enabled: true,
        };
        setImages(prev => [...prev, newImage]);
        setSelectedField(newImage.id);
    };

    // Eliminar imagen
    const removeImage = (imageId) => {
        setImages(prev => prev.filter(i => i.id !== imageId));
        if (selectedField === imageId) {
            setSelectedField(null);
        }
    };

    const { data, setData, post, processing } = useForm({
        positions: positions,
        labels: labels,
        images: images,
    });

    useEffect(() => {
        setData('positions', positions);
    }, [positions]);

    useEffect(() => {
        setData('labels', labels);
    }, [labels]);

    useEffect(() => {
        setData('images', images);
    }, [images]);

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

                                {/* Sección de Labels */}
                                <div className="mb-6 border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-medium text-gray-700">
                                            Labels personalizados
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addLabel}
                                            className="px-3 py-1 text-xs font-semibold bg-green-600 text-white rounded-md hover:bg-green-500"
                                        >
                                            + Agregar Label
                                        </button>
                                    </div>
                                    {labels.length > 0 ? (
                                        <div className="space-y-2">
                                            {labels.map((label, index) => (
                                                <div
                                                    key={label.id}
                                                    className={`flex items-center gap-2 p-2 rounded-md ${
                                                        selectedField === label.id
                                                            ? 'bg-indigo-100 border-2 border-indigo-600'
                                                            : 'bg-gray-100 border border-gray-200'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedField(label.id)}
                                                        className="flex-1 text-left text-sm truncate"
                                                    >
                                                        <span className="font-medium">#{index + 1}:</span>{' '}
                                                        {label.attribute_key ? (
                                                            <span className="text-green-600 italic">[{label.attribute_key}]</span>
                                                        ) : (
                                                            <span className="text-gray-600">{label.label_text || 'Sin texto'}</span>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLabel(label.id)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        title="Eliminar label"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">
                                            No hay labels. Haz clic en "Agregar Label" para crear uno.
                                        </p>
                                    )}
                                </div>

                                {/* Sección de Imágenes */}
                                <div className="mb-6 border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-medium text-gray-700">
                                            Imágenes dinámicas
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addImage}
                                            className="px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded-md hover:bg-amber-500"
                                            disabled={available_attributes.length === 0}
                                            title={available_attributes.length === 0 ? 'Importa personas con atributos primero' : ''}
                                        >
                                            + Agregar Imagen
                                        </button>
                                    </div>
                                    {images.length > 0 ? (
                                        <div className="space-y-2">
                                            {images.map((image, index) => (
                                                <div
                                                    key={image.id}
                                                    className={`flex items-center gap-2 p-2 rounded-md ${
                                                        selectedField === image.id
                                                            ? 'bg-amber-100 border-2 border-amber-600'
                                                            : 'bg-amber-50 border border-amber-200'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedField(image.id)}
                                                        className="flex-1 text-left text-sm truncate"
                                                    >
                                                        <span className="font-medium text-amber-700">🖼️ #{index + 1}:</span>{' '}
                                                        <span className="text-amber-600 italic">[{image.attribute_key || 'Sin atributo'}]</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(image.id)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        title="Eliminar imagen"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">
                                            No hay imágenes. Haz clic en "Agregar Imagen" para crear una.
                                        </p>
                                    )}
                                </div>

                                {selectedField && getCurrentField() && (
                                    <div className="mb-6 space-y-4 border-t pt-4">
                                        {/* Configuración de imagen - solo para imágenes */}
                                        {isCurrentFieldImage() && (
                                            <div className="space-y-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                <p className="text-sm font-medium text-amber-800">🖼️ Configuración de Imagen</p>
                                                
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Atributo de imagen
                                                    </label>
                                                    {available_attributes.length > 0 ? (
                                                        <select
                                                            value={getCurrentField()?.attribute_key || ''}
                                                            onChange={(e) => updateCurrentField({ attribute_key: e.target.value })}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                                                        >
                                                            {available_attributes.map((attr) => (
                                                                <option key={attr} value={attr}>
                                                                    {attr}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                                            No hay atributos disponibles.
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        El valor debe coincidir con el nombre de una imagen en la galería.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Ancho (px)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="10"
                                                            max="1000"
                                                            value={getCurrentField()?.image_width || 100}
                                                            onChange={(e) => updateCurrentField({ image_width: parseInt(e.target.value) })}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Alto (px)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="10"
                                                            max="1000"
                                                            value={getCurrentField()?.image_height || 100}
                                                            onChange={(e) => updateCurrentField({ image_height: parseInt(e.target.value) })}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="image_center_automatically"
                                                        checked={getCurrentField()?.center_automatically || false}
                                                        onChange={(e) => updateCurrentField({ center_automatically: e.target.checked })}
                                                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <label htmlFor="image_center_automatically" className="ml-2 block text-sm text-gray-700">
                                                        Centrar automáticamente (X variable)
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="image_enabled"
                                                        checked={getCurrentField()?.enabled ?? true}
                                                        onChange={(e) => updateCurrentField({ enabled: e.target.checked })}
                                                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <label htmlFor="image_enabled" className="ml-2 block text-sm text-gray-700">
                                                        Habilitar imagen
                                                    </label>
                                                </div>

                                                {/* Preview de imágenes disponibles */}
                                                {galleryImages.length > 0 && (
                                                    <div className="mt-3 p-2 bg-white rounded border border-amber-200">
                                                        <p className="text-xs font-medium text-gray-600 mb-2">Imágenes en galería:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {galleryImages.slice(0, 8).map((img) => (
                                                                <span key={img.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                                                    {img.name}
                                                                </span>
                                                            ))}
                                                            {galleryImages.length > 8 && (
                                                                <span className="text-xs text-gray-500">+{galleryImages.length - 8} más</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Configuración del label - solo para labels */}
                                        {selectedField !== 'name' && selectedField !== 'cedula' && !isCurrentFieldImage() && (
                                            <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                                <p className="text-sm font-medium text-green-800">Contenido del Label</p>
                                                
                                                {/* Selector de tipo de contenido */}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCurrentField({ attribute_key: '', label_text: getCurrentField()?.label_text || 'Texto' })}
                                                        className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold ${
                                                            !getCurrentField()?.attribute_key
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        Texto Fijo
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCurrentField({ attribute_key: available_attributes[0] || '', label_text: '' })}
                                                        className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold ${
                                                            getCurrentField()?.attribute_key
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                        disabled={available_attributes.length === 0}
                                                        title={available_attributes.length === 0 ? 'Importa personas con atributos primero' : ''}
                                                    >
                                                        Atributo Dinámico
                                                    </button>
                                                </div>

                                                {/* Input de texto fijo */}
                                                {!getCurrentField()?.attribute_key && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Texto a mostrar
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={getCurrentField()?.label_text || ''}
                                                            onChange={(e) => updateCurrentField({ label_text: e.target.value })}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                                                            placeholder="Ej: Certificado de Participación"
                                                        />
                                                    </div>
                                                )}

                                                {/* Selector de atributo dinámico */}
                                                {getCurrentField()?.attribute_key !== undefined && getCurrentField()?.attribute_key !== '' && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Atributo de la persona
                                                            </label>
                                                            {available_attributes.length > 0 ? (
                                                                <select
                                                                    value={getCurrentField()?.attribute_key || ''}
                                                                    onChange={(e) => updateCurrentField({ attribute_key: e.target.value, label_text: '' })}
                                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                                                                >
                                                                    {available_attributes.map((attr) => (
                                                                        <option key={attr} value={attr}>
                                                                            {attr}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                                                    No hay atributos disponibles. Importa personas con columnas adicionales primero.
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                El valor se tomará del atributo de cada persona al generar el certificado.
                                                            </p>
                                                        </div>

                                                        {/* Configuración de Prefijo */}
                                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                            <p className="text-xs font-medium text-blue-800 mb-2">Prefijo (opcional)</p>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                        Texto del prefijo
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={getCurrentField()?.prefix || ''}
                                                                        onChange={(e) => updateCurrentField({ prefix: e.target.value })}
                                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                                        placeholder='Ej: "Por "'
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Se mostrará antes del valor. Incluye el espacio si lo necesitas.
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                        Tamaño de fuente del prefijo
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="8"
                                                                        max="500"
                                                                        value={getCurrentField()?.prefix_font_size || getCurrentField()?.font_size || 14}
                                                                        onChange={(e) => updateCurrentField({ prefix_font_size: parseInt(e.target.value) })}
                                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Puedes usar un tamaño más pequeño que el valor principal.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tamaño de Fuente
                                            </label>
                                            <input
                                                type="number"
                                                min="8"
                                                max="500"
                                                value={getCurrentField()?.font_size || 14}
                                                onChange={(e) => updateCurrentField({ font_size: parseInt(e.target.value) })}
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
                                                            fontFamily: getCurrentField()?.font_family 
                                                                ? (getCurrentField().font_family.includes(' ') 
                                                                    ? `"${getCurrentField().font_family}"` 
                                                                    : getCurrentField().font_family)
                                                                : 'Arial',
                                                        }}
                                                    >
                                                        {getCurrentField()?.font_family || 'Arial'}
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
                                                                updateCurrentField({ font_family: font.family });
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
                                                Peso de Fuente
                                            </label>
                                            <select
                                                value={getCurrentField()?.font_weight || '400'}
                                                onChange={(e) => updateCurrentField({ font_weight: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                {fontWeightOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Color de Fuente
                                            </label>
                                            <input
                                                type="color"
                                                value={getCurrentField()?.font_color || '#000000'}
                                                onChange={(e) => updateCurrentField({ font_color: e.target.value })}
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
                                                    onClick={() => updateCurrentField({ text_align_horizontal: 'left' })}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        getCurrentField()?.text_align_horizontal === 'left'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Izquierda
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCurrentField({ text_align_horizontal: 'center' })}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        getCurrentField()?.text_align_horizontal === 'center'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Centro
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCurrentField({ text_align_horizontal: 'right' })}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        getCurrentField()?.text_align_horizontal === 'right'
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
                                                    onClick={() => updateCurrentField({ text_align_vertical: 'top' })}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        getCurrentField()?.text_align_vertical === 'top'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Arriba
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCurrentField({ text_align_vertical: 'middle' })}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        getCurrentField()?.text_align_vertical === 'middle'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Centro
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCurrentField({ text_align_vertical: 'bottom' })}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold ${
                                                        getCurrentField()?.text_align_vertical === 'bottom'
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
                                                checked={getCurrentField()?.center_automatically || false}
                                                onChange={(e) => updateCurrentField({ 
                                                    center_automatically: e.target.checked,
                                                    text_align_horizontal: e.target.checked ? 'center' : getCurrentField()?.text_align_horizontal
                                                })}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label
                                                htmlFor="center_automatically"
                                                className="ml-2 block text-sm text-gray-700"
                                            >
                                                Centrar automáticamente (X variable)
                                            </label>
                                        </div>

                                        {/* Checkbox para habilitar/deshabilitar - para cédula y labels */}
                                        {(selectedField === 'cedula' || (selectedField !== 'name' && selectedField !== 'cedula')) && (
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="field_enabled"
                                                    checked={getCurrentField()?.enabled ?? true}
                                                    onChange={(e) => updateCurrentField({ enabled: e.target.checked })}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <label
                                                    htmlFor="field_enabled"
                                                    className="ml-2 block text-sm text-gray-700"
                                                >
                                                    {selectedField === 'cedula' ? 'Habilitar cédula' : 'Habilitar label'}
                                                </label>
                                            </div>
                                        )}

                                        {/* Texto de vista previa - solo para nombre y cédula */}
                                        {(selectedField === 'name' || selectedField === 'cedula') && (
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
                                        )}
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
                                            fontWeight: positions.name.font_weight || '400',
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
                                            fontWeight: positions.cedula.font_weight || '400',
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

                                    {/* Indicadores de posición de los labels */}
                                    {labels.filter(l => l.enabled !== false && l.y > 0).map((label) => {
                                        const imageEl = imageRef.current;
                                        if (!imageEl) return null;
                                        
                                        const containerWidth = imageEl.offsetWidth;
                                        const containerHeight = imageEl.offsetHeight;
                                        const naturalWidth = imageEl.naturalWidth || imageEl.width;
                                        const naturalHeight = imageEl.naturalHeight || imageEl.height;
                                        
                                        if (containerWidth === 0 || containerHeight === 0 || naturalWidth === 0 || naturalHeight === 0) {
                                            return null;
                                        }
                                        
                                        const scaleX = containerWidth / naturalWidth;
                                        const scaleY = containerHeight / naturalHeight;
                                        const yScaled = label.y * scaleY;
                                        
                                        // Determinar texto para calcular el ancho
                                        const previewText = label.attribute_key 
                                            ? `[${label.attribute_key}]` 
                                            : (label.label_text || 'Label');
                                        
                                        let left;
                                        if (label.center_automatically) {
                                            left = containerWidth / 2;
                                        } else {
                                            const xScaled = label.x * scaleX;
                                            const textWidth = label.font_size * scaleX * 0.6 * previewText.length;
                                            if (label.text_align_horizontal === 'center') {
                                                left = xScaled - (textWidth / 2);
                                            } else if (label.text_align_horizontal === 'right') {
                                                left = xScaled - textWidth;
                                            } else {
                                                left = xScaled;
                                            }
                                        }
                                        
                                        const transforms = [];
                                        if (label.center_automatically) {
                                            transforms.push('translateX(-50%)');
                                        }
                                        if (label.text_align_vertical === 'middle') {
                                            transforms.push('translateY(-50%)');
                                        } else if (label.text_align_vertical === 'bottom') {
                                            transforms.push('translateY(-100%)');
                                        }
                                        
                                        const fontFamilyValue = label.font_family || 'Arial';
                                        const fontFamily = fontFamilyValue.includes(' ') 
                                            ? `"${fontFamilyValue}", sans-serif` 
                                            : `${fontFamilyValue}, sans-serif`;
                                        
                                        const styles = {
                                            position: 'absolute',
                                            left: `${left}px`,
                                            top: `${yScaled}px`,
                                            fontSize: `${label.font_size * scaleX}px`,
                                            fontFamily: fontFamily,
                                            fontWeight: label.font_weight || '400',
                                            color: label.font_color || '#000000',
                                            pointerEvents: 'none',
                                            border: selectedField === label.id ? '2px solid #10B981' : '1px solid #6EE7B7',
                                            backgroundColor: selectedField === label.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                            textAlign: label.center_automatically ? 'center' : (label.text_align_horizontal || 'left'),
                                            transform: transforms.length > 0 ? transforms.join(' ') : 'none',
                                            whiteSpace: 'pre',
                                        };
                                        
                                        // Determinar el texto a mostrar en la preview
                                        const attributeText = label.attribute_key 
                                            ? `[${label.attribute_key}]` 
                                            : (label.label_text || 'Label');
                                        
                                        // Mostrar prefijo si existe (agregar espacio automáticamente si no tiene)
                                        const hasPrefix = label.prefix && label.attribute_key;
                                        const prefixFontSize = label.prefix_font_size || label.font_size || 14;
                                        const prefixText = hasPrefix 
                                            ? (label.prefix.endsWith(' ') ? label.prefix : label.prefix + ' ')
                                            : '';
                                        
                                        return (
                                            <div key={label.id} style={styles}>
                                                {hasPrefix && (
                                                    <span style={{ fontSize: `${prefixFontSize * scaleX}px` }}>
                                                        {prefixText}
                                                    </span>
                                                )}
                                                {attributeText}
                                            </div>
                                        );
                                    })}

                                    {/* Indicadores de posición de las imágenes */}
                                    {images.filter(i => i.enabled !== false && i.y > 0).map((image) => {
                                        const imageEl = imageRef.current;
                                        if (!imageEl) return null;
                                        
                                        const containerWidth = imageEl.offsetWidth;
                                        const containerHeight = imageEl.offsetHeight;
                                        const naturalWidth = imageEl.naturalWidth || imageEl.width;
                                        const naturalHeight = imageEl.naturalHeight || imageEl.height;
                                        
                                        if (containerWidth === 0 || containerHeight === 0 || naturalWidth === 0 || naturalHeight === 0) {
                                            return null;
                                        }
                                        
                                        const scaleX = containerWidth / naturalWidth;
                                        const scaleY = containerHeight / naturalHeight;
                                        const yScaled = image.y * scaleY;
                                        const widthScaled = (image.image_width || 100) * scaleX;
                                        const heightScaled = (image.image_height || 100) * scaleY;
                                        
                                        let left;
                                        if (image.center_automatically) {
                                            left = containerWidth / 2;
                                        } else {
                                            left = image.x * scaleX;
                                        }
                                        
                                        const transforms = [];
                                        if (image.center_automatically) {
                                            transforms.push('translateX(-50%)');
                                        }
                                        
                                        // Encontrar imagen de preview en galería
                                        const galleryImg = galleryImages.find(g => g.name === image.attribute_key?.toLowerCase());
                                        
                                        const styles = {
                                            position: 'absolute',
                                            left: `${left}px`,
                                            top: `${yScaled}px`,
                                            width: `${widthScaled}px`,
                                            height: `${heightScaled}px`,
                                            pointerEvents: 'none',
                                            border: selectedField === image.id ? '3px solid #D97706' : '2px dashed #F59E0B',
                                            backgroundColor: selectedField === image.id ? 'rgba(217, 119, 6, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                                            transform: transforms.length > 0 ? transforms.join(' ') : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '4px',
                                        };
                                        
                                        return (
                                            <div key={image.id} style={styles}>
                                                {galleryImg ? (
                                                    <img 
                                                        src={galleryImg.file_url} 
                                                        alt={image.attribute_key}
                                                        className="max-w-full max-h-full object-contain opacity-70"
                                                    />
                                                ) : (
                                                    <span className="text-amber-600 text-xs font-medium bg-white px-2 py-1 rounded">
                                                        🖼️ [{image.attribute_key || 'imagen'}]
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Marcador de posición cuando se selecciona un campo */}
                                    {selectedField && getCurrentField() && getCurrentField().x > 0 && getCurrentField().y > 0 && (() => {
                                        const currentField = getCurrentField();
                                        const scaled = getScaledPosition(currentField.x, currentField.y);
                                        if (!scaled.scaleX) return null;
                                        
                                        const isLabel = selectedField !== 'name' && selectedField !== 'cedula';
                                        
                                        return (
                                            <div
                                                className="absolute pointer-events-none"
                                                style={{
                                                    left: `${scaled.x}px`,
                                                    top: `${scaled.y}px`,
                                                    transform: 'translate(-50%, -50%)',
                                                    width: '20px',
                                                    height: '20px',
                                                    border: isLabel ? '2px solid #10B981' : '2px solid #4F46E5',
                                                    borderRadius: '50%',
                                                    backgroundColor: isLabel ? 'rgba(16, 185, 129, 0.2)' : 'rgba(79, 70, 229, 0.2)',
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

