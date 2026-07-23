# Registro de Estudio Bíblico Personal — Laurita ✨

Una aplicación web cliente (100% estática), rápida, minimalista y responsive diseñada para llevar el registro de estudio bíblico personal de **Laurita**. Permite aprovechar tiempos libres cortos (bus, trabajo, almorzando), registrar actividades espirituales cotidianas y visualizar estadísticas de progreso.

---

## 🛠️ Stack Técnico

- **Frontend**: HTML5 semántico, CSS3 puro (variables CSS, flexbox/grid, sin librerías pesadas) y JavaScript Vanilla ES6+ modular.
- **Base de Datos**: Supabase (PostgreSQL) usando la librería cliente oficial de JavaScript (`@supabase/supabase-js`).
- **Visualización**: Chart.js para gráficos de progreso espiritual.
- **Hosting**: 100% estático compatible con **GitHub Pages**.

---

## 📁 Estructura del Proyecto

```text
registro-estudio-laurita/
├── index.html              # Estructura principal SPA (Navegación, vistas y modales)
├── style.css               # Paleta de colores clara, minimalista, responsive (mobile-first)
├── supabase_schema.sql     # Script SQL DDL con creación de tablas, índices y políticas RLS
├── README.md               # Guía completa de configuración y despliegue
└── js/
    ├── config.js           # Configuración del cliente Supabase (URL y anon key)
    ├── supabase.js         # Capa de servicios CRUD y respaldo local
    └── app.js              # Controlador SPA (rutas, filtros, formularios y estadísticas)
```

---

## 🚀 Pasos para Configurar Supabase

1. **Crear Proyecto en Supabase**:
   - Ingresa a [supabase.com](https://supabase.com) y crea una cuenta o inicia sesión.
   - Crea un nuevo proyecto llamado `estudio-laurita`.

2. **Ejecutar el Script SQL**:
   - En el panel de Supabase, ve a la sección **SQL Editor** en la barra lateral izquierda.
   - Abre el archivo `supabase_schema.sql` de este proyecto, copia todo su contenido y pégalo en el editor de SQL de Supabase.
   - Haz clic en **Run** (Ejecutar). Esto creará automáticamente:
     - Tabla `study_items` (con enum/restricciones de categorías y tiempos).
     - Tabla `spiritual_progress` (con tipos de actividad e historial).
     - Índices de consulta rápida.
     - Políticas de seguridad Nivel de Fila (RLS) habilitadas para acceso anónimo seguro.

3. **Obtener las Credenciales de API**:
   - Ve a **Project Settings** -> **API**.
   - Copia los siguientes dos valores:
     - **Project URL** (ej: `https://xxxx.supabase.co`)
     - **anon / public API key** (clave pública anónima).

4. **Configurar la Aplicación**:
   - Abre el archivo `js/config.js` en tu editor de código.
   - Reemplaza las constantes con tus credenciales real de Supabase:
     ```javascript
     const CONFIG = {
         SUPABASE_URL: "https://tu-proyecto.supabase.co",
         SUPABASE_ANON_KEY: "tu_anon_key_aqui"
     };
     ```

---

## 🌐 Pasos Exactos para Publicar en GitHub Pages

Dado que GitHub Pages es un hosting estático sin servidor backend, la aplicación se ejecuta 100% en el navegador utilizando la clave `anon` de Supabase protegida con Row Level Security (RLS).

### Pasos para publicar:

1. **Crear Repositorio en GitHub**:
   - Ingresa a tu cuenta de GitHub y crea un nuevo repositorio público o privado (ej: `registro-estudio-laurita`).

2. **Subir los Archivos al Repositorio**:
   - Inicializa git en la carpeta del proyecto y sube todos los archivos a la rama principal (`main`):
     ```bash
     git init
     git add .
     git commit -m "Inicializar app de estudio Laurita"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/registro-estudio-laurita.git
     git push -u origin main
     ```

3. **Activar GitHub Pages en la Configuración**:
   - Ve a la pestaña **Settings** (Configuración) de tu repositorio en GitHub.
   - En la barra lateral izquierda, busca la sección **Pages** (dentro de *Code and automation*).
   - En la opción **Build and deployment** -> **Source**:
     - Selecciona **Deploy from a branch**.
   - En **Branch**:
     - Selecciona la rama `main`.
     - Selecciona la carpeta `/ (root)` (Raíz del proyecto, donde se encuentra `index.html`).
   - Haz clic en **Save** (Guardar).

4. **¡Listo!**:
   - Espera unos 1 a 2 minutos. GitHub Pages generará una URL pública similar a:
     `https://TU_USUARIO.github.io/registro-estudio-laurita/`
   - Laurita podrá abrir este enlace en su teléfono móvil o computadora para usar la aplicación en cualquier momento.

---

## 💡 Nota de Seguridad sobre Supabase Anon Key y RLS

Es normal y esperado que en aplicaciones cliente o GitHub Pages la `SUPABASE_URL` y la `SUPABASE_ANON_KEY` queden visibles en el código fuente de JavaScript.
La clave `anon` está diseñada para ser pública. La seguridad real de la base de datos se garantiza activando **Row Level Security (RLS)** en Supabase (ya configurado en `supabase_schema.sql`), lo que limita exactamente qué acciones puede realizar un usuario anónimo sobre las tablas. Nunca incluyas la clave `service_role` en el código cliente.
