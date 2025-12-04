import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

export default function Show({ template }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(new Set());
    const imageRef = useRef(null);
    const [previewName] = useState('NOMBRE DE EJEMPLO');
    const [previewCedula] = useState('1234567890');

    const handleDelete = () => {
        if (confirm(`¿Estás seguro de eliminar el diseño "${template.name}"? Esta acción no se puede deshacer y también eliminará todas las posiciones configuradas.`)) {
            router.delete(route('templates.destroy', template.id));
        }
    };

    const hasPositions = template.positions && template.positions.length > 0;

    // Obtener posiciones específicas
    const namePos = template.positions?.find(p => p.field_type === 'name');
    const cedulaPos = template.positions?.find(p => p.field_type === 'cedula');
    const labelPositions = template.positions?.filter(p => p.field_type === 'label' && p.enabled !== false) || [];

    // Cargar fuentes de Google Fonts
    useEffect(() => {
        if (!template.positions) return;

        const fontsToLoad = new Set();
        template.positions.forEach(pos => {
            if (pos.font_family) fontsToLoad.add(pos.font_family);
        });

        const systemFonts = ['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia', 'Verdana', 'Tahoma'];

        fontsToLoad.forEach((font) => {
            if (!systemFonts.includes(font)) {
                const existingLink = document.querySelector(`link[data-google-font="${font}"]`);
                if (!existingLink) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
                    link.setAttribute('data-google-font', font);
                    link.onload = () => setFontsLoaded(prev => new Set([...prev, font]));
                    document.head.appendChild(link);
                }
            }
        });
    }, [template.positions]);

    // Formatear nombre del tipo de campo
    const formatFieldType = (position) => {
        if (position.field_type === 'name') return 'Nombre';
        if (position.field_type === 'cedula') return 'Cédula';
        if (position.field_type === 'label') {
            if (position.attribute_key) {
                return `Label: [${position.attribute_key}]`;
            }
            return `Label: "${position.label_text || 'Sin texto'}"`;
        }
        if (position.field_type === 'image') {
            return `Imagen: [${position.attribute_key || 'Sin atributo'}]`;
        }
        return position.field_type;
    };

    // Filtrar posiciones de imagen
    const imagePositions = template.positions?.filter(p => p.field_type === 'image' && p.enabled !== false) || [];

    // Formatear peso de fuente
    const formatFontWeight = (weight) => {
        const weights = {
            '100': 'Thin',
            '200': 'Extra Light',
            '300': 'Light',
            '400': 'Regular',
            '500': 'Medium',
            '600': 'Semi Bold',
            '700': 'Bold',
            '800': 'Extra Bold',
            '900': 'Black',
        };
        return weights[weight] || weight;
    };

    // Renderizar texto superpuesto
    const renderTextOverlay = (position, text, isSelected = false, key = null) => {
        const imageEl = imageRef.current;
        if (!imageEl || !imageLoaded) return null;

        const containerWidth = imageEl.offsetWidth;
        const containerHeight = imageEl.offsetHeight;
        const naturalWidth = imageEl.naturalWidth || imageEl.width;
        const naturalHeight = imageEl.naturalHeight || imageEl.height;

        if (containerWidth === 0 || containerHeight === 0 || naturalWidth === 0 || naturalHeight === 0) {
            return null;
        }

        const scaleX = containerWidth / naturalWidth;
        const scaleY = containerHeight / naturalHeight;
        const yScaled = position.y * scaleY;

        let left;
        if (position.center_automatically) {
            left = containerWidth / 2;
        } else {
            const xScaled = position.x * scaleX;
            const textWidth = position.font_size * scaleX * 0.6 * text.length;
            if (position.text_align_horizontal === 'center') {
                left = xScaled - (textWidth / 2);
            } else if (position.text_align_horizontal === 'right') {
                left = xScaled - textWidth;
            } else {
                left = xScaled;
            }
        }

        const transforms = [];
        if (position.center_automatically) {
            transforms.push('translateX(-50%)');
        }
        if (position.text_align_vertical === 'middle') {
            transforms.push('translateY(-50%)');
        } else if (position.text_align_vertical === 'bottom') {
            transforms.push('translateY(-100%)');
        }

        const fontFamilyValue = position.font_family || 'Arial';
        const fontFamily = fontFamilyValue.includes(' ')
            ? `"${fontFamilyValue}", sans-serif`
            : `${fontFamilyValue}, sans-serif`;

        const isLabel = position.field_type === 'label';
        const hasPrefix = isLabel && position.prefix && position.attribute_key;
        const prefixFontSize = position.prefix_font_size || position.font_size || 14;
        const prefixText = hasPrefix 
            ? (position.prefix.endsWith(' ') ? position.prefix : position.prefix + ' ')
            : '';

        const styles = {
            position: 'absolute',
            left: `${left}px`,
            top: `${yScaled}px`,
            fontFamily: fontFamily,
            fontWeight: position.font_weight || '400',
            color: position.font_color || '#000000',
            pointerEvents: 'none',
            border: isLabel ? '1px dashed #10B981' : '1px dashed #6366F1',
            backgroundColor: isLabel ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            padding: '2px 4px',
            borderRadius: '2px',
            textAlign: position.center_automatically ? 'center' : (position.text_align_horizontal || 'left'),
            transform: transforms.length > 0 ? transforms.join(' ') : 'none',
            whiteSpace: 'pre',
        };

        return (
            <div key={key || position.id} style={styles}>
                {hasPrefix && (
                    <span style={{ fontSize: `${prefixFontSize * scaleX}px` }}>
                        {prefixText}
                    </span>
                )}
                <span style={{ fontSize: `${position.font_size * scaleX}px` }}>
                    {text}
                </span>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {template.name}
                    </h2>
                    <div className="flex gap-2">
                        <Link
                            href={route('templates.edit', template.id)}
                            className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
                        >
                            Editar
                        </Link>
                        <Link
                            href={route('certificates.configure', template.id)}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            Configurar Posiciones
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={template.name} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Vista Previa con diseño */}
                        <div className="lg:col-span-2">
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Vista Previa del Certificado
                                </h3>
                                <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                    <img
                                        ref={imageRef}
                                        src={template.file_url}
                                        alt={template.name}
                                        className="max-w-full h-auto"
                                        onLoad={() => setImageLoaded(true)}
                                    />

                                    {/* Nombre */}
                                    {imageLoaded && namePos && renderTextOverlay(namePos, previewName)}

                                    {/* Cédula */}
                                    {imageLoaded && cedulaPos && cedulaPos.enabled !== false && renderTextOverlay(cedulaPos, previewCedula)}

                                    {/* Labels */}
                                    {imageLoaded && labelPositions.map((label) => {
                                        const displayText = label.attribute_key
                                            ? `[${label.attribute_key}]`
                                            : (label.label_text || 'Label');
                                        return renderTextOverlay(label, displayText, false, `label-${label.id}`);
                                    })}

                                    {/* Imágenes */}
                                    {imageLoaded && imagePositions.map((image) => {
                                        const imageEl = imageRef.current;
                                        if (!imageEl) return null;

                                        const containerWidth = imageEl.offsetWidth;
                                        const naturalWidth = imageEl.naturalWidth || imageEl.width;
                                        const naturalHeight = imageEl.naturalHeight || imageEl.height;

                                        if (containerWidth === 0 || naturalWidth === 0 || naturalHeight === 0) {
                                            return null;
                                        }

                                        const scaleX = containerWidth / naturalWidth;
                                        const scaleY = imageEl.offsetHeight / naturalHeight;
                                        const yScaled = image.y * scaleY;
                                        const widthScaled = (image.image_width || 100) * scaleX;
                                        const heightScaled = (image.image_height || 100) * scaleY;

                                        let left;
                                        if (image.center_automatically) {
                                            left = containerWidth / 2 - widthScaled / 2;
                                        } else {
                                            left = image.x * scaleX;
                                        }

                                        return (
                                            <div
                                                key={`image-${image.id}`}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${left}px`,
                                                    top: `${yScaled}px`,
                                                    width: `${widthScaled}px`,
                                                    height: `${heightScaled}px`,
                                                    border: '2px dashed #D97706',
                                                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '4px',
                                                    pointerEvents: 'none',
                                                }}
                                            >
                                                <span className="text-amber-600 text-xs font-medium bg-white px-2 py-1 rounded">
                                                    🖼️ [{image.attribute_key || 'imagen'}]
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {!hasPositions && (
                                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800">
                                            No se han configurado las posiciones aún. Haz clic en
                                            "Configurar Posiciones" para definir dónde se colocarán los elementos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Panel de información */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Información del Diseño
                                </h3>
                                
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <strong>Nombre:</strong> {template.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Tipo:</strong> {template.file_type.toUpperCase()}
                                    </p>
                                </div>

                                <h4 className="text-md font-semibold text-gray-900 mb-3">
                                    Campos Configurados
                                </h4>

                                {hasPositions ? (
                                    <div className="space-y-3">
                                        {template.positions.map((position) => {
                                            const isLabel = position.field_type === 'label';
                                            const isImage = position.field_type === 'image';
                                            const isDisabled = position.enabled === false;
                                            
                                            return (
                                                <div
                                                    key={position.id}
                                                    className={`border rounded-lg p-3 ${
                                                        isDisabled 
                                                            ? 'border-gray-200 bg-gray-50 opacity-60' 
                                                            : isImage
                                                                ? 'border-amber-200 bg-amber-50'
                                                                : isLabel 
                                                                    ? 'border-green-200 bg-green-50' 
                                                                    : 'border-indigo-200 bg-indigo-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                            isImage
                                                                ? 'bg-amber-200 text-amber-800'
                                                                : isLabel 
                                                                    ? 'bg-green-200 text-green-800' 
                                                                    : 'bg-indigo-200 text-indigo-800'
                                                        }`}>
                                                            {formatFieldType(position)}
                                                        </span>
                                                        {isDisabled && (
                                                            <span className="text-xs text-gray-500">(Deshabilitado)</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-xs text-gray-600 space-y-1">
                                                        <p>
                                                            <strong>Posición:</strong>{' '}
                                                            {position.center_automatically 
                                                                ? `Centrado, Y: ${position.y}` 
                                                                : `X: ${position.x}, Y: ${position.y}`}
                                                        </p>
                                                        
                                                        {/* Para imágenes mostrar dimensiones */}
                                                        {isImage ? (
                                                            <p>
                                                                <strong>Dimensiones:</strong> {position.image_width || 100}x{position.image_height || 100}px
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <p>
                                                                    <strong>Fuente:</strong>{' '}
                                                                    <span style={{ fontFamily: position.font_family }}>
                                                                        {position.font_family}
                                                                    </span>
                                                                </p>
                                                                <p>
                                                                    <strong>Tamaño:</strong> {position.font_size}px
                                                                </p>
                                                                <p>
                                                                    <strong>Peso:</strong> {formatFontWeight(position.font_weight)}
                                                                </p>
                                                                <p className="flex items-center gap-2">
                                                                    <strong>Color:</strong>
                                                                    <span
                                                                        className="inline-block w-4 h-4 rounded border border-gray-300"
                                                                        style={{ backgroundColor: position.font_color }}
                                                                    ></span>
                                                            <span>{position.font_color}</span>
                                                                </p>
                                                                <p>
                                                                    <strong>Alineación:</strong>{' '}
                                                                    {position.text_align_horizontal || 'left'} / {position.text_align_vertical || 'top'}
                                                                </p>
                                                            </>
                                                        )}
                                                        
                                                        {/* Mostrar prefijo si existe */}
                                                        {isLabel && position.prefix && (
                                                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                                <p className="text-blue-800">
                                                                    <strong>Prefijo:</strong> "{position.prefix}"
                                                                </p>
                                                                <p className="text-blue-800">
                                                                    <strong>Tamaño prefijo:</strong> {position.prefix_font_size || position.font_size}px
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800">
                                            Sin configuración
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6 pt-4 border-t">
                                    <Link
                                        href={route('templates.index')}
                                        className="w-full inline-flex justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                                    >
                                        Volver a Plantillas
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
