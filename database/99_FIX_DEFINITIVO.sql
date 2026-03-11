-- ============================================================
-- FIX DEFINITIVO - Ejecuta este script en Supabase SQL Editor
-- Soluciona: columnas faltantes + permisos RLS
-- ============================================================

-- 1. Añadir columnas que faltan (sin errores si ya existen)
ALTER TABLE public.operativo_tickets
ADD COLUMN IF NOT EXISTS asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notas_admin TEXT,
ADD COLUMN IF NOT EXISTS resolucion TEXT,
ADD COLUMN IF NOT EXISTS resuelto_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS diagnosticado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS diagnosticado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS origen_falla TEXT,
ADD COLUMN IF NOT EXISTS gravedad_real TEXT,
ADD COLUMN IF NOT EXISTS notas_diagnostico TEXT,
ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT FALSE;

-- 2. Eliminar todas las políticas UPDATE existentes en la tabla
DROP POLICY IF EXISTS "Admins can update tickets" ON public.operativo_tickets;
DROP POLICY IF EXISTS "update_tickets" ON public.operativo_tickets;
DROP POLICY IF EXISTS "Users can update assigned tickets" ON public.operativo_tickets;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus tickets asignados" ON public.operativo_tickets;
DROP POLICY IF EXISTS "Admins pueden actualizar cualquier ticket" ON public.operativo_tickets;
DROP POLICY IF EXISTS "Any authenticated user can update tickets" ON public.operativo_tickets;

-- 3. Crear una política UPDATE simple: cualquier usuario autenticado puede actualizar
CREATE POLICY "Any authenticated user can update tickets"
ON public.operativo_tickets
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Asegurarse de que RLS está activado
ALTER TABLE public.operativo_tickets ENABLE ROW LEVEL SECURITY;

SELECT 'FIX DEFINITIVO APLICADO CORRECTAMENTE ✅' AS resultado;
