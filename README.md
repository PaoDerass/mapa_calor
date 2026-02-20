# Sistema de Mapa de Calor e Incidentes

Este proyecto es una aplicación web para la visualización y gestión de incidentes geolocalizados, con integración de una base de datos externa de tickets (MySQL) y una base de datos propia para gestión de usuarios, roles y auditoría (PostgreSQL con PostGIS).

## Estructura del Proyecto

- `/backend`: API REST construida con FastAPI y SQLAlchemy.
- `/Frontend`: Interfaz de usuario construida con React, Vite y Bootstrap.

---

## Requisitos Previos

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 15+** (con extensión PostGIS instalada)
- **MySQL / MariaDB** (para la base de datos de tickets externos)

---

## Configuración del Backend

1. **Navegar al directorio del backend:**
   ```bash
   cd backend
   ```

2. **Crear y activar entorno virtual:**
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\activate
   ```

3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno (.env):**
   Crea un archivo `.env` en `/backend` con el siguiente contenido:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=tu_password
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=mapa_calor

   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_SERVER=localhost
   MYSQL_PORT=3306
   MYSQL_DB=tickets_sistema_dev

   SECRET_KEY=una_clave_secreta_muy_larga
   ALGORITHM=HS256
   ```

5. **Inicializar Base de Datos (PostgreSQL):**
   Ejecuta el script de reconstrucción para crear tablas y datos iniciales:
   ```bash
   python init_db.py
   python seed.py
   ```

6. **Iniciar el servidor:**
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

---

## Configuración del Frontend

1. **Navegar al directorio del frontend:**
   ```bash
   cd Frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

---

## Características Implementadas

- **Visor de Mapas**: Mapa interactivo con Leaflet que muestra incidentes con iconos personalizados por tipo.
- **Búsqueda Externa**: Búsqueda de tickets en tiempo real desde la base de datos MySQL.
- **Gestión de Usuarios**: Sistema de roles (Admin, Analista, Operador, Supervisor) y asignación por Regionales.
- **Auditoría**: Registro de quién crea cada incidente y logs de acciones del sistema.
- **Diseño Institucional**: Interfaz limpia utilizando Bootstrap 5 y FontAwesome 6.

## Credenciales por Defecto (Desarrollo)
- **Usuario**: `admin`
- **Contraseña**: `admin123`
