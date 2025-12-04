# Changelog

## *v 1.1*

### ✨ Nuevas funcionalidades

- **Labels personalizados**: Agrega campos de texto adicionales con texto estático o valores dinámicos desde atributos de la persona
- **Atributos dinámicos**: Las personas ahora pueden tener campos JSON personalizables
- **Prefijos**: Soporte para texto prefijo con tamaño de fuente independiente
- **Galería de imágenes**: Nueva sección para subir y gestionar imágenes reutilizables (logos, firmas, sellos)
- **Imágenes dinámicas**: Inserta imágenes de la galería en certificados según atributos de la persona
- **Generación asíncrona**: Para lotes de más de 5 certificados, procesamiento en cola con seguimiento de progreso
- **Historial de certificados**: Nueva página para ver todos los lotes generados con su estado
- **Descarga ZIP**: Los lotes grandes se empaquetan automáticamente en un archivo ZIP

### 🔧 Mejoras

- Soporte para peso de fuente (font-weight) en todos los campos de texto
- Nuevo comando `composer dev` para iniciar servidor, cola y vite simultáneamente
- Mejor organización de archivos generados por lotes

---

## *v 1.0*

### 🎉 Lanzamiento inicial

- Gestión de plantillas de certificados (subida de imágenes PNG/JPG)
- Configuración visual de posiciones de texto (nombre y cédula)
- Integración con Google Fonts
- Alineación horizontal y vertical de texto
- Centrado automático de texto
- Opción para habilitar/deshabilitar cédula
- Gestión de personas (individual y masiva)
- Generación de certificados PDF con DomPDF
- Autenticación de usuarios con Laravel Breeze

