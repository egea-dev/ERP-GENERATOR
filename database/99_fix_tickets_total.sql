-- SCRIPT DE SINCRONIZACIÓN TOTAL PARA SISTEMA DE TICKETS
-- Ejecuta este script en el editor SQL de Supabase para corregir errores 404/400

-- 1. Asegurar columnas en operativo_tickets
DO $$ 
BEGIN 
    -- Columnas de Diagnóstico Maestro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operativo_tickets' AND column_name='origen_falla') THEN
        ALTER TABLE public.operativo_tickets ADD COLUMN origen_falla TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operativo_tickets' AND column_name='gravedad_real') THEN
        ALTER TABLE public.operativo_tickets ADD COLUMN gravedad_real INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operativo_tickets' AND column_name='notas_diagnostico') THEN
        ALTER TABLE public.operativo_tickets ADD COLUMN notas_diagnostico TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operativo_tickets' AND column_name='accion_inmediata') THEN
        ALTER TABLE public.operativo_tickets ADD COLUMN accion_inmediata TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operativo_tickets' AND column_name='diagnosticado_at') THEN
        ALTER TABLE public.operativo_tickets ADD COLUMN diagnosticado_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operativo_tickets' AND column_name='diagnosticado_por') THEN
        ALTER TABLE public.operativo_tickets ADD COLUMN diagnosticado_por UUID REFERENCES public.profiles(id);
    END IF;

    -- Columna de Número de Ticket (TK-1000)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operativo_tickets' AND column_name='num_ticket') THEN
        ALTER TABLE public.operativo_tickets ADD COLUMN num_ticket INT GENERATED ALWAYS AS IDENTITY (START WITH 1000);
    END IF;

END $$;

-- 2. Asegurar tabla de Activity Log
CREATE TABLE IF NOT EXISTS public.ticket_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.operativo_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL, -- 'comentario', 'cambio_estado', 'solucion'
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Asegurar tabla de Knowledge Base
CREATE TABLE IF NOT EXISTS public.operativo_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.operativo_tickets(id) ON DELETE SET NULL,
    categoria TEXT,
    problema TEXT NOT NULL,
    solucion TEXT NOT NULL,
    leccion_aprendida TEXT,
    creado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS y Políticas
ALTER TABLE public.ticket_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operativo_knowledge ENABLE ROW LEVEL SECURITY;

-- Políticas Log
DROP POLICY IF EXISTS "Ver logs" ON public.ticket_activity_log;
CREATE POLICY "Ver logs" ON public.ticket_activity_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertar logs" ON public.ticket_activity_log;
CREATE POLICY "Insertar logs" ON public.ticket_activity_log FOR INSERT WITH CHECK (true);

-- Políticas Knowledge
DROP POLICY IF EXISTS "Ver conocimiento" ON public.operativo_knowledge;
CREATE POLICY "Ver conocimiento" ON public.operativo_knowledge FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insertar conocimiento" ON public.operativo_knowledge;
CREATE POLICY "Insertar conocimiento" ON public.operativo_knowledge FOR INSERT WITH CHECK (true);

-- Notificar éxito
COMMENT ON TABLE public.operativo_tickets IS 'Sincronizado con Éxito por Hacchi';
