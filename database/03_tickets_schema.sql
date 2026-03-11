-- TABLA DE TICKETS OPERATIVOS (AMPLIADA)
CREATE TABLE IF NOT EXISTS public.operativo_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    modulo TEXT,
    prioridad TEXT DEFAULT 'Normal', -- 'Muy Urgente', 'Urgente', 'Normal'
    estado TEXT DEFAULT 'Pendiente',  -- 'Pendiente', 'En proceso', 'Resuelto', 'Archivado'
    captura_contexto JSONB,
    asignado_a UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notas_admin TEXT,
    resuelto_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    origen_falla TEXT, -- 'Software', 'Humano', 'Cliente', 'Externo'
    gravedad_real INTEGER, -- 1-5
    notas_diagnostico TEXT,
    accion_inmediata TEXT,
    diagnosticado_at TIMESTAMPTZ,
    diagnosticado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    num_ticket INT GENERATED ALWAYS AS IDENTITY (START WITH 1000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA DE LOG DE ACTIVIDAD DE TICKETS
CREATE TABLE IF NOT EXISTS public.ticket_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.operativo_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL, -- 'comentario', 'cambio_estado', 'solucion'
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.operativo_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para operativo_tickets (Idempotentes)
DROP POLICY IF EXISTS "Usuarios pueden crear sus propios tickets" ON public.operativo_tickets;
CREATE POLICY "Usuarios pueden crear sus propios tickets" 
ON public.operativo_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios tickets" ON public.operativo_tickets;
CREATE POLICY "Usuarios pueden ver sus propios tickets" 
ON public.operativo_tickets FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = asignado_a);

DROP POLICY IF EXISTS "Admins pueden ver todos los tickets" ON public.operativo_tickets;
CREATE POLICY "Admins pueden ver todos los tickets" 
ON public.operativo_tickets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins y Asignados pueden actualizar tickets" ON public.operativo_tickets;
CREATE POLICY "Admins y Asignados pueden actualizar tickets" 
ON public.operativo_tickets FOR UPDATE 
USING (
  auth.uid() = asignado_a OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para ticket_activity_log
DROP POLICY IF EXISTS "Usuarios pueden ver logs de sus tickets" ON public.ticket_activity_log;
CREATE POLICY "Usuarios pueden ver logs de sus tickets"
ON public.ticket_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.operativo_tickets 
    WHERE id = ticket_id AND (user_id = auth.uid() OR asignado_a = auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins y Asignados pueden insertar logs" ON public.ticket_activity_log;
CREATE POLICY "Admins y Asignados pueden insertar logs"
ON public.ticket_activity_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.operativo_tickets 
    WHERE id = ticket_id AND asignado_a = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- TABLA DE BASE DE CONOCIMIENTO (LECCIONES APRENDIDAS)
CREATE TABLE IF NOT EXISTS public.operativo_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.operativo_tickets(id) ON DELETE SET NULL,
    categoria TEXT, -- 'Software', 'Hardware', 'Procedimiento', etc.
    problema TEXT NOT NULL,
    solucion TEXT NOT NULL,
    leccion_aprendida TEXT,
    creado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para operativo_knowledge
ALTER TABLE public.operativo_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos pueden ver la base de conocimiento" ON public.operativo_knowledge;
CREATE POLICY "Todos pueden ver la base de conocimiento"
ON public.operativo_knowledge FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Solo admins pueden insertar en conocimiento" ON public.operativo_knowledge;
CREATE POLICY "Solo admins pueden insertar en conocimiento"
ON public.operativo_knowledge FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
