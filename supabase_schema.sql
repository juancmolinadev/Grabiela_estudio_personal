-- ==============================================================================
-- REGISTRO DE ESTUDIO BÍBLICO PERSONAL DE LAURITA
-- Script de Creación de Base de Datos para Supabase (PostgreSQL)
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
    study_item_id UUID NULL REFERENCES study_items(id) ON DELETE SET NULL,
    minutos_invertidos INTEGER NOT NULL CHECK (minutos_invertidos > 0),
    fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_study_items_estado_cat ON study_items(estado, categoria);
CREATE INDEX IF NOT EXISTS idx_study_items_libro_padre ON study_items(libro_padre_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_progress_fecha ON spiritual_progress(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_spiritual_progress_tipo ON spiritual_progress(tipo_actividad);

-- 4. SEGURIDAD NIVEL DE FILA (RLS - Row Level Security)
ALTER TABLE study_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_progress ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura, inserción y actualización abiertas para el cliente anon key de la app
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

-- 5. DATOS DE EJEMPLO INICIALES (OPCIONAL)
INSERT INTO study_items (categoria, titulo, enlace, tiempo_estimado, estado) VALUES
('atalaya', 'La Atalaya (Edición de estudio) - Artículo 1', 'https://wol.jw.org', '10-20', 'pendiente'),
('texto_corto', 'Examinando las Escrituras diariamente - Texto de hoy', 'https://wol.jw.org', '<=10', 'pendiente'),
('versiculo', 'Filipenses 4:6,7 - No se inquieten por nada', NULL, '<=10', 'pendiente')
ON CONFLICT DO NOTHING;
