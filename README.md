# KAJA — TPV Web

Sistema de punto de venta (TPV) web desarrollado como Trabajo de Fin de Grado (DAW).  
Stack: **React + PHP nativo + MariaDB**.

---

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado en tu máquina:

| Herramienta | Versión mínima |
|-------------|----------------|
| [Node.js](https://nodejs.org/) | 18.x o superior |
| [PHP](https://www.php.net/downloads) | 8.2 o superior |
| [MariaDB](https://mariadb.org/download/) / MySQL | 10.6 o superior |
| [Git](https://git-scm.com/) | Cualquier versión reciente |

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/Diiegooo1414/KAJA.git
cd KAJA
```

---

## 2. Configurar la base de datos

1. Abre tu cliente de MariaDB/MySQL (terminal, DBeaver, phpMyAdmin, etc.).
2. Crea una base de datos vacía:

```sql
CREATE DATABASE kaja_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Importa el esquema y los datos iniciales desde la raíz del proyecto:

```bash
mysql -u <tu_usuario> -p kaja_db < kaja_db.sql
```

---

## 3. Configurar el backend

### 3.1 Crear el archivo `.env`

Dentro de la carpeta `backend/`, crea un archivo llamado `.env` con el siguiente contenido y rellena los valores con tu configuración:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kaja_db
DB_USER=tu_usuario_db
DB_PASS=tu_contraseña_db

# JWT — usa una cadena larga y aleatoria como clave secreta
JWT_SECRET=cambia_esto_por_una_clave_secreta_segura
JWT_TTL=28800

# Cloudinary — necesario para la subida de imágenes
# Crea una cuenta gratuita en https://cloudinary.com y copia tus credenciales
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 3.2 Arrancar el servidor PHP

Desde la carpeta `backend/`, ejecuta:

```bash
cd backend
php -S localhost:8000 router.php
```

El servidor de la API quedará disponible en `http://localhost:8000`.

---

## 4. Configurar el frontend

### 4.1 Crear el archivo `.env`

Dentro de la carpeta `frontend/`, crea un archivo llamado `.env` con la URL de la API que arrancaste en el paso anterior:

```env
VITE_API_URL=http://localhost:8000
```

### 4.2 Instalar dependencias

```bash
cd frontend
npm install
```

### 4.3 Arrancar la aplicación en modo desarrollo

```bash
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173` (o el puerto que indique Vite en la terminal).

---

## 5. Primer acceso

Al importar `kaja_db.sql` se crea automáticamente una empresa y un usuario administrador de ejemplo con el que puedes iniciar sesión por primera vez. Consulta el propio archivo SQL para ver las credenciales iniciales.

Una vez dentro, desde el panel de **Configuración** puedes actualizar los datos de la empresa y del perfil de administrador, y desde **Usuarios** puedes crear los empleados que necesites.

---

## Estructura del proyecto

```
KAJA/
├── backend/          # API REST en PHP nativo
│   ├── Api/          # Endpoints (un archivo por recurso)
│   ├── Config/       # Conexión a BD y carga de variables de entorno
│   ├── Controllers/  # Lógica de negocio
│   ├── Helpers/      # JWT y utilidades
│   ├── Models/       # Acceso a datos
│   └── router.php    # Punto de entrada del servidor
├── frontend/         # SPA en React + Vite + Tailwind CSS
│   ├── public/
│   └── src/
│       ├── views/    # Páginas de la aplicación
│       └── main.jsx  # Punto de entrada de React
└── kaja_db.sql       # Esquema y datos iniciales de la base de datos
```

---

## Scripts disponibles (frontend)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compilación optimizada para producción |
| `npm run preview` | Previsualización del build de producción |
