-- Esto forzará que TODOS los usuarios actuales del sistema se conviertan en 'admin'.
-- Ejecútalo en el SQL Editor de Supabase si te has quedado bloqueado sin permisos de administrador.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
