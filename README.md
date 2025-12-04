# Sistema de Generación de Certificados

Sistema web desarrollado con Laravel y React para la generación automática de certificados en formato PDF. Permite crear plantillas personalizadas, gestionar personas y generar certificados masivos con información personalizada.

## 🚀 Características

### Gestión de Plantillas
- Sube imágenes (PNG, JPG, JPEG) como diseños de certificados
- Configuración visual de posiciones de texto e imágenes
- Editor interactivo con vista previa en tiempo real

### Personalización de Texto
- **Google Fonts**: Integración completa con API de Google Fonts
- **Peso de fuente**: Soporte para diferentes pesos (100-900)
- **Alineación**: Control completo horizontal (izquierda, centro, derecha) y vertical (arriba, medio, abajo)
- **Centrado Automático**: Opción para centrar texto independientemente de su longitud
- **Colores personalizados**: Selector de color para cada campo

### Campos Dinámicos
- **Nombre**: Campo obligatorio para el nombre de la persona
- **Cédula**: Campo opcional, puede habilitarse/deshabilitarse
- **Labels Personalizados**: Textos estáticos o valores dinámicos desde atributos de la persona
- **Prefijos**: Texto prefijo con tamaño de fuente independiente
- **Imágenes Dinámicas**: Insertar imágenes de la galería según atributos de la persona

### Gestión de Personas
- Registro individual con nombre, cédula y atributos personalizados
- **Importación masiva** desde texto (formato CSV)
- **Atributos dinámicos**: Campos JSON personalizables por persona

### Generación de Certificados
- **Generación síncrona**: Para 5 o menos certificados (descarga inmediata)
- **Generación asíncrona**: Para más de 5 certificados (procesamiento en cola)
- **Progreso en tiempo real**: Seguimiento del estado de generación
- **Descarga ZIP**: Todos los certificados en un archivo comprimido
- **Historial completo**: Registro de todos los lotes generados

### Galería de Imágenes
- Sube imágenes reutilizables (logos, firmas, sellos)
- Asigna nombres para vincularlas con atributos de personas
- Inserta imágenes dinámicamente en los certificados

## 📋 Requisitos

- PHP >= 8.2
- Composer
- Node.js >= 18
- npm o yarn
- Base de datos MySQL o SQLite
- Extensiones PHP: PDO, OpenSSL, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, Zip

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/mangomorado/certificados.git
   cd certificados
   ```

2. **Instalar dependencias de PHP**
   ```bash
   composer install
   ```

3. **Instalar dependencias de Node.js**
   ```bash
   npm install
   ```

4. **Configurar el archivo de entorno**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configurar la base de datos**
   
   Edita el archivo `.env` y configura tu base de datos:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=certificados
   DB_USERNAME=tu_usuario
   DB_PASSWORD=tu_contraseña
   ```

6. **Ejecutar migraciones**
   ```bash
   php artisan migrate
   ```

7. **Crear el enlace simbólico de storage**
   ```bash
   php artisan storage:link
   ```

8. **Compilar assets**
   ```bash
   npm run build
   ```

9. **Iniciar el servidor de desarrollo**
   ```bash
   # Opción 1: Solo servidor (generación síncrona)
   php artisan serve

   # Opción 2: Servidor + Cola (recomendado para generación masiva)
   composer dev
   ```

   El proyecto estará disponible en `http://localhost:8000`

## 📖 Uso

### 1. Crear un Usuario

Puedes crear un usuario desde la interfaz web (registro) o usando Laravel Tinker:

```bash
php artisan tinker
```

```php
User::create([
    'name' => 'Tu Nombre',
    'email' => 'tu@email.com',
    'password' => Hash::make('tu_contraseña'),
]);
```

### 2. Crear Diseños de Certificados

1. Ve a **Diseños** en el menú
2. Haz clic en **Crear Nuevo Diseño**
3. Sube una imagen (PNG, JPG o JPEG) como plantilla
4. Asigna un nombre al diseño

### 3. Configurar Posiciones del Texto

1. Abre el diseño creado
2. Haz clic en **Configurar Posiciones**
3. **Para el Nombre**:
   - Haz clic en la imagen donde quieres posicionarlo
   - Ajusta tamaño, fuente, color y alineación
4. **Para la Cédula** (opcional):
   - Activa/desactiva con el toggle
   - Configura posición y estilo
5. **Para Labels Personalizados**:
   - Clic en "Agregar Label"
   - Elige entre texto estático o atributo dinámico
   - Opcionalmente agrega un prefijo
6. **Para Imágenes Dinámicas**:
   - Clic en "Agregar Imagen"
   - Selecciona el atributo que contiene el nombre de la imagen
   - Define dimensiones
7. Guarda las posiciones

### 4. Subir Imágenes a la Galería

1. Ve a **Galería** en el menú
2. Haz clic en **Subir Imagen**
3. Asigna un nombre identificador (ej: "logo_empresa")
4. Este nombre debe coincidir con el valor del atributo en las personas

### 5. Agregar Personas

#### Individual
1. Ve a **Personas** en el menú
2. Haz clic en **Agregar Persona**
3. Completa:
   - Nombre (obligatorio)
   - Cédula (opcional)
   - Atributos personalizados (JSON)
4. Guarda

#### Masivo
1. Ve a **Personas** → **Agregar Persona**
2. Selecciona el modo **Masivo**
3. Ingresa las personas en el formato:
   ```
   Nombre Completo, Cédula
   Juan Pérez, 1234567890
   María González, 0987654321
   ```
4. Cada línea es un nuevo registro
5. Guarda

### 6. Generar Certificados

1. Ve a **Generar** en el menú
2. Selecciona un diseño de certificado
3. Selecciona las personas (checkbox)
4. Haz clic en **Generar Certificados**
5. **Si son ≤5 certificados**: Descarga inmediata
6. **Si son >5 certificados**: 
   - Se inicia procesamiento en cola
   - Ve a **Historial** para seguir el progreso
   - Descarga el ZIP cuando esté listo

### 7. Ver Historial

1. Ve a **Historial** en el menú
2. Ve todos los lotes generados con su estado:
   - 🟡 Pendiente
   - 🔵 Procesando
   - 🟢 Completado
   - 🔴 Fallido
3. Descarga certificados individuales o el ZIP completo

## ⚙️ Configuración

### Google Fonts API Key (Opcional)

1. Ve a **Configuración** en el menú
2. Ingresa tu API Key de Google Fonts
3. Si no proporcionas una API Key, se usarán las fuentes públicas de Google Fonts

Para obtener una API Key:
- Visita [Google Fonts Developer API](https://developers.google.com/fonts/docs/developer_api)
- Crea un proyecto en Google Cloud Console
- Habilita la API de Google Fonts
- Genera una API Key

### Cola de Trabajos

Para habilitar la generación asíncrona de certificados, ejecuta:

```bash
php artisan queue:listen
```

O usa el comando de desarrollo que incluye todo:

```bash
composer dev
```

## 🗂️ Estructura del Proyecto

```
certificados/
├── app/
│   ├── Http/Controllers/
│   │   ├── CertificateController.php         # Configuración y generación
│   │   ├── CertificateHistoryController.php  # Historial de lotes
│   │   ├── CertificateTemplateController.php # CRUD de plantillas
│   │   ├── GalleryController.php             # Galería de imágenes
│   │   ├── PersonController.php              # CRUD de personas
│   │   ├── ProfileController.php             # Perfil de usuario
│   │   └── SettingsController.php            # Configuración
│   ├── Jobs/
│   │   └── GenerateCertificatesJob.php       # Job de generación asíncrona
│   ├── Models/
│   │   ├── CertificateBatch.php              # Lotes de certificados
│   │   ├── CertificateItem.php               # Items individuales del lote
│   │   ├── CertificatePosition.php           # Posiciones de texto/imagen
│   │   ├── CertificateTemplate.php           # Plantillas
│   │   ├── GalleryImage.php                  # Imágenes de galería
│   │   ├── Person.php                        # Personas
│   │   ├── Settings.php                      # Configuración
│   │   └── User.php                          # Usuarios
│   └── Providers/
├── database/
│   └── migrations/                           # Migraciones de base de datos
├── resources/
│   └── js/
│       ├── Components/                       # Componentes React reutilizables
│       ├── Layouts/
│       │   └── AuthenticatedLayout.jsx       # Layout principal
│       └── Pages/
│           ├── Auth/                         # Login, registro, etc.
│           ├── Certificates/
│           │   ├── BatchDetail.jsx           # Detalle de un lote
│           │   ├── Configure.jsx             # Editor de posiciones
│           │   ├── Generate.jsx              # Página de generación
│           │   └── History.jsx               # Historial de lotes
│           ├── Gallery/
│           │   └── Index.jsx                 # Galería de imágenes
│           ├── People/                       # CRUD de personas
│           ├── Settings/                     # Configuración
│           └── Templates/                    # CRUD de plantillas
└── storage/
    └── app/public/
        ├── certificates/                     # Certificados generados
        │   ├── batch_X/                      # Carpeta por lote
        │   └── zips/                         # Archivos ZIP
        ├── gallery/                          # Imágenes de galería
        └── templates/                        # Plantillas subidas
```

## 🔒 Seguridad

- ✅ No se exponen credenciales en el código
- ✅ Todas las configuraciones sensibles usan variables de entorno
- ✅ Archivos `.env` y `database.sqlite` están en `.gitignore`
- ✅ Logs y archivos de storage están protegidos
- ✅ Autenticación requerida para todas las rutas principales

**Antes de publicar en GitHub**, verifica que:
- No tengas archivos `.env` en el repositorio
- No tengas `database/database.sqlite` en el repositorio
- No tengas archivos de log en el repositorio

## 🛠️ Tecnologías Utilizadas

| Componente | Tecnología |
|------------|------------|
| **Backend** | Laravel 12 |
| **Frontend** | React 18 + Inertia.js |
| **Estilos** | Tailwind CSS |
| **UI Components** | Headless UI |
| **PDF** | DomPDF |
| **Build Tool** | Vite 7 |
| **Base de Datos** | MySQL/SQLite |
| **Fuentes** | Google Fonts API |
| **Cola de trabajos** | Laravel Queue |
| **Autenticación** | Laravel Breeze |

## 🚀 Scripts Disponibles

```bash
# Desarrollo (servidor + cola + logs + vite)
composer dev

# Solo compilar assets
npm run build

# Desarrollo de frontend
npm run dev

# Ejecutar tests
composer test

# Setup inicial completo
composer setup
```

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la [Licencia MIT](https://opensource.org/licenses/MIT).

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

Para reportar problemas o sugerencias, por favor abre un issue en el repositorio de GitHub.
