# Sistema de Generación de Certificados

Sistema web desarrollado con Laravel y React para la generación automática de certificados en formato PDF. Permite crear plantillas personalizadas, gestionar personas y generar certificados masivos con información personalizada.

## 🚀 Características

- **Gestión de Plantillas**: Sube imágenes (PNG, JPG, JPEG) como diseños de certificados
- **Configuración Visual**: Posiciona texto (nombre y cédula) de forma visual en el diseño
- **Google Fonts**: Integración con Google Fonts para personalizar tipografías
- **Alineación de Texto**: Control completo de alineación horizontal y vertical
- **Centrado Automático**: Opción para centrar automáticamente el texto (útil para nombres de diferentes longitudes)
- **Habilitar/Deshabilitar Cédula**: Opción para incluir o excluir la cédula en los certificados
- **Registro Masivo**: Importa múltiples personas desde un campo de texto
- **Generación Masiva**: Genera certificados PDF para múltiples personas de una vez

## 📋 Requisitos

- PHP >= 8.2
- Composer
- Node.js >= 18
- npm o yarn
- Base de datos MySQL o SQLite
- Extensiones PHP: PDO, OpenSSL, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath

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
   php artisan serve
   ```

   El proyecto estará disponible en `http://localhost:8000`

## 📖 Uso

### 1. Crear un Usuario

Puedes crear un usuario desde la interfaz web o usando Laravel Tinker:

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
3. Selecciona **Posicionar Nombre** o **Posicionar Cédula**
4. Haz clic en la imagen donde quieres que aparezca el texto
5. Ajusta:
   - Tamaño de fuente
   - Familia de fuente (busca en Google Fonts)
   - Color de fuente
   - Alineación horizontal (izquierda, centro, derecha)
   - Alineación vertical (arriba, centro, abajo)
   - Centrado automático (para nombres)
   - Habilitar/deshabilitar cédula
6. Guarda las posiciones

### 4. Agregar Personas

#### Individual
1. Ve a **Personas** en el menú
2. Haz clic en **Agregar Persona**
3. Completa nombre y cédula
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

### 5. Generar Certificados

1. Ve a **Generar** en el menú
2. Selecciona un diseño de certificado
3. Selecciona las personas para las que quieres generar certificados
4. Haz clic en **Generar Certificados**
5. Los PDFs se descargarán automáticamente

## ⚙️ Configuración

### Google Fonts API Key (Opcional)

1. Ve a **Configuración** en el menú
2. Ingresa tu API Key de Google Fonts (opcional)
3. Si no proporcionas una API Key, se usarán las fuentes públicas de Google Fonts

Para obtener una API Key:
- Visita [Google Fonts Developer API](https://developers.google.com/fonts/docs/developer_api)
- Crea un proyecto en Google Cloud Console
- Habilita la API de Google Fonts
- Genera una API Key

## 🗂️ Estructura del Proyecto

```
certificados/
├── app/
│   ├── Http/Controllers/
│   │   ├── CertificateController.php      # Generación de certificados
│   │   ├── CertificateTemplateController.php
│   │   ├── PersonController.php
│   │   └── SettingsController.php
│   ├── Models/
│   │   ├── CertificateTemplate.php
│   │   ├── CertificatePosition.php
│   │   ├── Person.php
│   │   └── Settings.php
│   └── Services/
├── database/
│   └── migrations/                        # Migraciones de base de datos
├── resources/
│   └── js/
│       ├── Pages/
│       │   ├── Certificates/             # Vistas de certificados
│       │   ├── People/                    # Vistas de personas
│       │   ├── Templates/                 # Vistas de plantillas
│       │   └── Settings/                  # Vista de configuración
│       └── Layouts/
└── storage/
    └── app/public/
        ├── certificates/                  # Certificados generados
        └── templates/                     # Plantillas subidas
```

## 🔒 Seguridad

- ✅ No se exponen credenciales en el código
- ✅ Todas las configuraciones sensibles usan variables de entorno
- ✅ Archivos `.env` y `database.sqlite` están en `.gitignore`
- ✅ Logs y archivos de storage están protegidos

**Antes de publicar en GitHub**, verifica que:
- No tengas archivos `.env` en el repositorio
- No tengas `database/database.sqlite` en el repositorio
- No tengas archivos de log en el repositorio

## 🛠️ Tecnologías Utilizadas

- **Backend**: Laravel 11
- **Frontend**: React 18 + Inertia.js
- **Estilos**: Tailwind CSS
- **PDF**: DomPDF
- **Base de Datos**: MySQL/SQLite
- **Fuentes**: Google Fonts API

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
