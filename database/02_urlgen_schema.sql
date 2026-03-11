-- SCRIPT SQL COMPLETO PARA SUPABASE (ERP ERP MODULES)

-- 1. Tablas Maestras (RefGen)
CREATE TABLE IF NOT EXISTS familias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(4) UNIQUE NOT NULL, -- Ej: CDRT
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    familia_codigo VARCHAR(4) REFERENCES familias(codigo),
    codigo VARCHAR(4) NOT NULL, -- Ej: CJ
    descripcion TEXT,
    UNIQUE(familia_codigo, codigo)
);

-- 2. Tabla Artículos (RefGen)
CREATE TABLE IF NOT EXISTS articulos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referencia VARCHAR(15) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    familia VARCHAR(4),
    tipo VARCHAR(4),
    variante VARCHAR(10),
    ancho VARCHAR(10),
    alto VARCHAR(10),
    creado_por UUID REFERENCES auth.users(id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla Directorios de Proyectos (URLGen)
CREATE TABLE IF NOT EXISTS directorios_proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_directorio VARCHAR(15) UNIQUE NOT NULL, -- [CRE][PRO][NOMBRE_ASIGNADO]
    credencial_usuario VARCHAR(3) NOT NULL,        -- Ej: U01
    nombre_proyecto TEXT NOT NULL,
    codigo_proyecto VARCHAR(3) NOT NULL,           -- Ej: DEC (extraído del nombre)
    nombre_asignado VARCHAR(9) NOT NULL,           -- Máximo 9 caracteres
    descripcion TEXT,
    ruta_completa TEXT,                            -- URL simulada
    creado_por UUID REFERENCES auth.users(id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Políticas de Seguridad (RLS)
ALTER TABLE familias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE directorios_proyectos ENABLE ROW LEVEL SECURITY;

-- Permisos Lectura/Escritura para usuarios autenticados
CREATE POLICY "Auth access select" ON familias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth access select" ON tipos_producto FOR SELECT TO authenticated USING (true);

CREATE POLICY "Articulos access" ON articulos FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Directorios access" ON directorios_proyectos FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 5. Datos Iniciales de ejemplo (Opcional)
INSERT INTO familias (codigo, descripcion) VALUES ('CDRT', 'Cuadrante'), ('TELA', 'Tela por metro');
