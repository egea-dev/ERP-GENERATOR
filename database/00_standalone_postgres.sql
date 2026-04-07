-- 00_standalone_postgres.sql
-- Este script crea la estructura de base de datos para funcionar sin Supabase.

-- 1. Tabla de Usuarios (Reemplaza auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla de Roles (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'user')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Tabla de Logs de Auditoría
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    module_name TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabla de Artículos (alineada con backend routes/data.js)
CREATE TABLE IF NOT EXISTS public.articulos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referencia TEXT,
    nombre TEXT,
    descripcion TEXT,
    familia TEXT,
    tipo TEXT,
    variante TEXT,
    ancho INTEGER,
    alto INTEGER,
    precio DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    creado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabla de Directorios (URLGen) (alineada con backend routes/data.js)
CREATE TABLE IF NOT EXISTS public.directorios_proyectos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_directorio TEXT,
    credencial_usuario TEXT,
    nombre_proyecto TEXT,
    codigo_proyecto TEXT,
    nombre_asignado TEXT,
    descripcion TEXT,
    ruta_completa TEXT,
    creado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabla de Tickets (Operativo) (alineada con backend routes/data.js y frontend)
CREATE TABLE IF NOT EXISTS public.operativo_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    prioridad TEXT DEFAULT 'Normal' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente', 'Normal', 'Muy Urgente')),
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Abierto', 'Pendiente', 'Diagnosticado', 'En proceso', 'Resuelto', 'Cerrado', 'Archivado')),
    modulo TEXT DEFAULT 'General',
    asignado_a UUID REFERENCES public.users(id) ON DELETE SET NULL,
    archivado BOOLEAN DEFAULT false,
    origen_falla TEXT,
    gravedad_real INTEGER,
    accion_inmediata TEXT,
    notas_diagnostico TEXT,
    num_ticket SERIAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    diagnosticado_at TIMESTAMP WITH TIME ZONE,
    diagnosticado_por UUID REFERENCES public.users(id),
    resuelto_at TIMESTAMP WITH TIME ZONE
);

-- 7. Tabla de Conocimiento (Knowledge Base)
CREATE TABLE IF NOT EXISTS public.operativo_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creado_por UUID REFERENCES public.users(id),
    ticket_id UUID REFERENCES public.operativo_tickets(id) ON DELETE SET NULL,
    titulo TEXT,
    categoria TEXT,
    problema TEXT,
    solucion TEXT,
    contenido TEXT,
    tags TEXT[],
    leccion_aprendida TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Log de Actividad de Tickets
CREATE TABLE IF NOT EXISTS public.ticket_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.operativo_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    tipo TEXT NOT NULL,
    contenido TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Embeddings (RAG)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS public.erp_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Tabla de Proveedores (Biblioteca de Tarifas)
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Versiones de Tarifas (historico por proveedor/ano)
CREATE TABLE IF NOT EXISTS public.tarifa_versiones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
    importe_year INTEGER NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    nombre_archivo TEXT,
    source_headers JSONB DEFAULT '[]'::jsonb,
    source_rows JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(proveedor_id, importe_year, revision)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tarifa_versiones_active_unique
    ON public.tarifa_versiones(proveedor_id, importe_year)
    WHERE is_active;

-- 12. Tabla de Tarifas (Biblioteca de Tarifas versionada)
CREATE TABLE IF NOT EXISTS public.tarifas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_id UUID REFERENCES public.tarifa_versiones(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE CASCADE,
    referencia TEXT NOT NULL,
    serie TEXT,
    clave_descripcion TEXT,
    articulo TEXT NOT NULL,
    familia TEXT,
    ancho INTEGER,
    alto INTEGER,
    precio DECIMAL(10,2),
    descripcion TEXT,
    importe_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para tarifas
CREATE INDEX IF NOT EXISTS idx_tarifa_versiones_proveedor ON public.tarifa_versiones(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_tarifa_versiones_year ON public.tarifa_versiones(importe_year DESC);
CREATE INDEX IF NOT EXISTS idx_tarifas_proveedor ON public.tarifas(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_version ON public.tarifas(version_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_referencia ON public.tarifas(referencia);
CREATE INDEX IF NOT EXISTS idx_tarifas_familia ON public.tarifas(familia);
CREATE INDEX IF NOT EXISTS idx_tarifas_year ON public.tarifas(importe_year);

-- Índices de rendimiento para producción
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_articulos_referencia ON public.articulos(referencia);
CREATE INDEX IF NOT EXISTS idx_articulos_fecha ON public.articulos(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.operativo_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON public.operativo_tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_asignado ON public.operativo_tickets(asignado_a);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.operativo_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_archivado ON public.operativo_tickets(archivado);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_directorios_creado_por ON public.directorios_proyectos(creado_por);
CREATE INDEX IF NOT EXISTS idx_ticket_activity_ticket ON public.ticket_activity_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_categoria ON public.operativo_knowledge(categoria);

-- Índice HNSW para búsqueda vectorial (RAG)
CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw ON public.erp_embeddings USING hnsw (embedding vector_cosine_ops);

-- 13. Configuración de Paneles (qué módulos ven los usuarios)
CREATE TABLE IF NOT EXISTS public.panel_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    panel_id TEXT UNIQUE NOT NULL,
    panel_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    visible_roles TEXT[] DEFAULT '{admin,editor,user}',
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed de paneles por defecto
INSERT INTO public.panel_config (panel_id, panel_name, enabled, visible_roles, sort_order) VALUES
('refgen', 'REFGEN', true, '{admin,editor,user}', 1),
('urlgen', 'URLGEN', true, '{admin,editor,user}', 2),
('chat', 'CONSULTAS IA', true, '{admin,editor,user}', 3),
('tarifas', 'TARIFAS', true, '{admin,editor,user}', 4),
('envios', 'ENVÍOS', true, '{admin,editor,user}', 5)
ON CONFLICT (panel_id) DO NOTHING;

-- Usuario admin por defecto (password: Admin123!)
INSERT INTO public.users (email, password_hash, full_name) VALUES
('admin@egeadev.cloud', '$2b$10$/V7ISz/WMnwY5J/x1ERuIejzi50HFbNkwZqfZKEirtgyD3uDLiCMK', 'Administrador')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_roles (user_id, role) VALUES
((SELECT id FROM public.users WHERE email = 'admin@egeadev.cloud'), 'admin')
ON CONFLICT DO NOTHING;
