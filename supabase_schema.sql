-- ==============================================================================
-- REGISTRO DE ESTUDIO BÍBLICO PERSONAL DE LAURITA
-- Script de Creación y Actualización de Base de Datos para Supabase (PostgreSQL)
-- ==============================================================================

-- 1. TABLA: study_items
-- Almacena las opciones de estudio disponibles (pendientes) y completadas (finalizadas).
CREATE TABLE IF NOT EXISTS study_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL CHECK (categoria IN ('atalaya', 'texto_corto', 'versiculo', 'libro', 'capitulo')),
    titulo TEXT NOT NULL,
    enlace TEXT NULL,
    libro_padre_id UUID NULL REFERENCES study_items(id) ON DELETE CASCADE,
    tiempo_estimado TEXT NULL CHECK (tiempo_estimado IN ('<=10', '10-20', '>30')),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'finalizado')),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_finalizado TIMESTAMPTZ NULL
);

-- 2. TABLA: spiritual_progress
-- Almacena el historial del tiempo invertido en actividades espirituales.
CREATE TABLE IF NOT EXISTS spiritual_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_actividad TEXT NOT NULL CHECK (tipo_actividad IN ('predicar', 'estudiar_reuniones', 'estudio_personal', 'estudio_grupo', 'estudio_tiempo_libre')),
    subtipo TEXT NULL,
    study_item_id UUID NULL REFERENCES study_items(id) ON DELETE SET NULL,
    minutos_invertidos INTEGER NOT NULL CHECK (minutos_invertidos > 0),
    fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asegurar columna subtipo si la tabla ya existía anteriormente
ALTER TABLE spiritual_progress ADD COLUMN IF NOT EXISTS subtipo TEXT NULL;

-- 3. TABLA: daily_texts
-- Almacena los textos diarios programados para cada fecha.
CREATE TABLE IF NOT EXISTS daily_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL UNIQUE,
    versiculo TEXT NOT NULL,
    texto_relacionado TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: app_settings
-- Almacena configuraciones generales de la aplicación (ej. meta mensual de horas).
CREATE TABLE IF NOT EXISTS app_settings (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_study_items_estado_cat ON study_items(estado, categoria);
CREATE INDEX IF NOT EXISTS idx_study_items_libro_padre ON study_items(libro_padre_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_progress_fecha ON spiritual_progress(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_spiritual_progress_tipo ON spiritual_progress(tipo_actividad);
CREATE INDEX IF NOT EXISTS idx_daily_texts_fecha ON daily_texts(fecha);

-- 6. SEGURIDAD NIVEL DE FILA (RLS - Row Level Security)
ALTER TABLE study_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura, inserción, actualización y eliminación
DROP POLICY IF EXISTS "Permitir lectura en study_items" ON study_items;
CREATE POLICY "Permitir lectura en study_items" ON study_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion en study_items" ON study_items;
CREATE POLICY "Permitir insercion en study_items" ON study_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion en study_items" ON study_items;
CREATE POLICY "Permitir actualizacion en study_items" ON study_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion en study_items" ON study_items;
CREATE POLICY "Permitir eliminacion en study_items" ON study_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir lectura en spiritual_progress" ON spiritual_progress;
CREATE POLICY "Permitir lectura en spiritual_progress" ON spiritual_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion en spiritual_progress" ON spiritual_progress;
CREATE POLICY "Permitir insercion en spiritual_progress" ON spiritual_progress FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion en spiritual_progress" ON spiritual_progress;
CREATE POLICY "Permitir actualizacion en spiritual_progress" ON spiritual_progress FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion en spiritual_progress" ON spiritual_progress;
CREATE POLICY "Permitir eliminacion en spiritual_progress" ON spiritual_progress FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir lectura en daily_texts" ON daily_texts;
CREATE POLICY "Permitir lectura en daily_texts" ON daily_texts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion en daily_texts" ON daily_texts;
CREATE POLICY "Permitir insercion en daily_texts" ON daily_texts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion en daily_texts" ON daily_texts;
CREATE POLICY "Permitir actualizacion en daily_texts" ON daily_texts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion en daily_texts" ON daily_texts;
CREATE POLICY "Permitir eliminacion en daily_texts" ON daily_texts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir lectura en app_settings" ON app_settings;
CREATE POLICY "Permitir lectura en app_settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion en app_settings" ON app_settings;
CREATE POLICY "Permitir insercion en app_settings" ON app_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion en app_settings" ON app_settings;
CREATE POLICY "Permitir actualizacion en app_settings" ON app_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion en app_settings" ON app_settings;
CREATE POLICY "Permitir eliminacion en app_settings" ON app_settings FOR DELETE USING (true);

-- 7. DATOS DE EJEMPLO INICIALES Y CONFIGURACIONES
INSERT INTO study_items (categoria, titulo, enlace, tiempo_estimado, estado) VALUES
('atalaya', 'La Atalaya (Edición de estudio) - Artículo 1', 'https://wol.jw.org', '10-20', 'pendiente'),
('texto_corto', 'Examinando las Escrituras diariamente - Texto de hoy', 'https://wol.jw.org', '<=10', 'pendiente'),
('versiculo', 'Filipenses 4:6,7 - No se inquieten por nada', NULL, '<=10', 'pendiente')
ON CONFLICT DO NOTHING;

INSERT INTO daily_texts (fecha, versiculo, texto_relacionado) VALUES
(CURRENT_DATE, 'Salmo 119:105', 'Tu palabra es una lámpara para mi pie y una luz para mi camino. Meditar en la palabra de Dios nos da guía clara para cada día.')
ON CONFLICT (fecha) DO NOTHING;

INSERT INTO app_settings (clave, valor) VALUES
('monthly_goal', '60.0')
ON CONFLICT (clave) DO NOTHING;
