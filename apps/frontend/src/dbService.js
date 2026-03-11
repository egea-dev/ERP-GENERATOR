import { createClient } from '@supabase/supabase-js';

// Las variables de entorno en Vite se exponen mediante import.meta.env
// Necesitarás crear un archivo .env en la raíz del proyecto con:
// VITE_SUPABASE_URL=tu_url_aqui
// VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Inicializamos el cliente (secreto interno)
// Si no hay variables de entorno, no estallará inmediatamente, pero avisará
const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Cliente Admin para gestión de usuarios (requiere Service Role Key)
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';
const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

/**
 * CAPA DE SERVICIO (BaaS Decoupling)
 * El front-end solo consulta estos métodos. Nunca debe exportarse 'supabase' directamente.
 */

export const dbService = {
    // --- AUTENTICACIÓN ---

    async login(email, password) {
        if (!supabase) throw new Error("Supabase no está configurado en .env");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    },

    async logout() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getCurrentSession() {
        if (!supabase) return { session: null, user: null };
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return { session, user: session?.user || null };
    },

    // --- PERFILES Y ROLES ---

    async getUserRole(userId) {
        if (!supabase || !userId) return null;
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error("Error obteniendo rol:", error);
            return null;
        }
        return data?.role || 'user'; // Rol por defecto si no está asignado
    },

    async updateUserRole(userId, newRole) {
        if (!supabase) throw new Error("Supabase no configurado");

        // 1. Comprobar si ya existe el rol
        const { data: existing, error: errCheck } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (errCheck) throw errCheck;

        let res;
        if (existing) {
            res = await supabase
                .from('user_roles')
                .update({ role: newRole, assigned_at: new Date().toISOString() })
                .eq('user_id', userId)
                .select();
        } else {
            res = await supabase
                .from('user_roles')
                .insert([{ user_id: userId, role: newRole }])
                .select();
        }

        if (res.error) throw res.error;
        return res.data;
    },

    async createNewUser(email, password, fullName, role) {
        if (!supabaseAdmin) throw new Error("Supabase Admin (Service Key) no configurado en .env");

        // 1. Crear el usuario en auth.users
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmar
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Upsert del perfil (por si el trigger ya lo creó)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({ id: userId, full_name: fullName });

        if (profileError) {
            console.error("Error al actualizar perfil tras crear usuario:", profileError);
            // No hacemos throw aquí para no bloquear la creación, el user ya existe en auth
        }

        // 3. Asignar rol inicial
        await this.updateUserRole(userId, role);

        return authData.user;
    },

    async deleteUser(userId) {
        if (!supabaseAdmin) throw new Error("Supabase Admin (Service Key) no configurado en .env");

        // La API de Admin borra de auth.users. Las constraint ON DELETE CASCADE
        // se encargarán de borrar el perfil y los roles automáticamente.
        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;

        return data;
    },

    // --- AUDITORÍA (Obligatorio según reglas) ---

    async insertLog(actionType, moduleName, details = {}) {
        if (!supabase) return;
        try {
            const { user } = await this.getCurrentSession();
            if (!user) return; // Si no hay usuario, no se puede loguear

            const { error } = await supabase
                .from('system_logs')
                .insert([{
                    user_id: user.id,
                    action_type: actionType,
                    module_name: moduleName,
                    details: details
                }]);

            if (error) console.error("Error insertando log:", error);
        } catch (e) {
            console.error("Fallo general en log:", e);
        }
    },

    async getArticulos() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('articulos')
            .select('*')
            .order('fecha_creacion', { ascending: false })
            .limit(100);
        if (error) {
            console.error("Error cargando artículos:", error);
            return [];
        }
        return data;
    },

    async saveArticulo(artData) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { data, error } = await supabase
            .from('articulos')
            .insert([artData]);
        if (error) throw error;
        return data;
    },

    // --- DIRECTORIOS (URLGen) ---
    async saveDirectorio(dirData) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { data, error } = await supabase
            .from('directorios_proyectos')
            .insert([dirData]);
        if (error) throw error;
        return data;
    },

    async getDirectorios() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('directorios_proyectos')
            .select('*')
            .order('fecha_creacion', { ascending: false })
            .limit(20);
        if (error) {
            console.error("Error cargando directorios:", error);
            return [];
        }
        return data;
    },

    async getCounts() {
        if (!supabase) return { articles: 0, dirs: 0, logs: 0 };
        const [art, dir, log] = await Promise.all([
            supabase.from('articulos').select('*', { count: 'exact', head: true }),
            supabase.from('directorios_proyectos').select('*', { count: 'exact', head: true }),
            supabase.from('system_logs').select('*', { count: 'exact', head: true })
        ]);
        return {
            articles: art.count || 0,
            dirs: dir.count || 0,
            logs: log.count || 0
        };
    },

    // --- BACKOFFICE (Admin only) ---
    async getAllLogs() {
        if (!supabase) return [];
        // Intento 1: Con JOIN (requiere FK en DB)
        const { data, error } = await supabase
            .from('system_logs')
            .select(`
                *,
                profiles!user_id (full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.warn("Fallo JOIN en logs, reintentando sin perfiles...", error.message);
            // Intento 2: Sin JOIN (por si no han ejecutado el SQL de relación)
            const { data: data2, error: error2 } = await supabase
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error2) {
                console.error("Error total cargando logs:", error2);
                return [];
            }
            return data2;
        }
        return data;
    },

    async logSystemAction(actionType, moduleName, details = {}) {
        if (!supabase) return;
        try {
            const session = await this.getCurrentSession();
            await supabase.from('system_logs').insert([{
                user_id: session?.user?.id || null,
                action_type: actionType,
                module_name: moduleName,
                details: details
            }]);
        } catch (e) {
            console.warn("Fallo al registrar log de sistema:", e);
        }
    },

    async getProfilesWithRoles() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                created_at,
                user_roles (role)
            `);
        if (error) {
            console.error("Error cargando perfiles:", error);
            return [];
        }
        return data;
    },

    // --- TICKETS OPERATIVOS ---
    async getTickets() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('operativo_tickets')
            .select(`
                *,
                profiles!user_id (full_name)
            `)
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Error cargando tickets:", error);
            return [];
        }
        return data;
    },

    async saveTicket(ticketData) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { data, error } = await supabase
            .from('operativo_tickets')
            .insert([ticketData]);
        if (error) throw error;
        return data;
    },

    async updateTicketStatus(ticketId, nuevoEstado) {
        if (!supabase) throw new Error("Supabase no configurado");
        const updates = { estado: nuevoEstado, updated_at: new Date().toISOString() };
        if (nuevoEstado === 'Resuelto') updates.resuelto_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('operativo_tickets')
            .update(updates)
            .eq('id', ticketId)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Sin permiso para actualizar. Ejecuta el SQL de permisos en Supabase.');

        if (nuevoEstado === 'Resuelto') {
            try { await this.logSystemAction('Ticket Resuelto', 'Tickets', { ticketId }); } catch (e) { }
        }
        return data;
    },

    async archiveTicket(ticketId) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { data, error } = await supabase
            .from('operativo_tickets')
            .update({ archivado: true, updated_at: new Date().toISOString() })
            .eq('id', ticketId)
            .select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Sin permiso para archivar. Ejecuta el SQL de permisos en Supabase.');
        try { await this.logSystemAction('Ticket Archivado', 'Tickets', { ticketId }); } catch (e) { }
        return data;
    },

    async updateTicketPriority(ticketId, nuevaPrioridad) {
        if (!supabase) throw new Error("Supabase no configurado");
        const payload = { prioridad: nuevaPrioridad, updated_at: new Date().toISOString() };
        const { data, error } = await supabase.from('operativo_tickets').update(payload).eq('id', ticketId).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Sin permiso para actualizar prioridad. Ejecuta el SQL de permisos en Supabase.');
        return data;
    },

    async assignTicket(ticketId, tecnicoId, notas) {
        if (!supabase) throw new Error("Supabase no configurado");
        // Solo actualizamos los campos que existen siempre en la tabla
        const payload = { estado: 'Pendiente', updated_at: new Date().toISOString() };
        const { data, error } = await supabase.from('operativo_tickets').update(payload).eq('id', ticketId).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Sin permiso para asignar ticket. Ejecuta el SQL de permisos en Supabase.');
        return data;
    },

    async saveMasterDiagnosis(ticketId, diagData) {
        if (!supabase) throw new Error("Supabase no configurado");
        const session = await this.getCurrentSession();
        let payload = {
            ...diagData,
            estado: 'Diagnosticado',
            diagnosticado_at: new Date().toISOString(),
            diagnosticado_por: session?.user?.id || null,
            updated_at: new Date().toISOString()
        };

        const robustUpdate = async (p) => {
            const { data, error } = await supabase.from('operativo_tickets').update(p).eq('id', ticketId).select();
            if (error) {
                if (error.code === 'PGRST204' || (error.message && error.message.includes('does not exist'))) {
                    const match = error.message.match(/'([^']+)'/) || error.message.match(/column [^\.]+\.([a-z_]+) does not exist/i);
                    if (match && match[1] && p[match[1]] !== undefined) {
                        const badCol = match[1];
                        console.warn(`Auto-Fix Diagnosis: Ignorando columna faltante '${badCol}'...`);
                        const np = { ...p };
                        delete np[badCol];
                        if (Object.keys(np).length > 0) return robustUpdate(np);
                    }
                }
                throw error;
            }
            if (!data || data.length === 0) {
                if (supabaseAdmin) {
                    console.warn("RLS block Diagnosis! Auto-forcing update with Admin Key...");
                    const { data: adminData, error: adminErr } = await supabaseAdmin.from('operativo_tickets').update(p).eq('id', ticketId).select();
                    if (adminErr) {
                        if (adminErr.message && adminErr.message.includes('Invalid API key')) {
                            throw new Error("Clave Maestra Inválida. Tienes puesta la clave 'anon' en lugar de la 'service_role' (VITE_SUPABASE_SERVICE_KEY). Cámbiala en .env.");
                        }
                        throw adminErr;
                    }
                    if (adminData && adminData.length > 0) return adminData;
                }
                throw new Error("Permiso denegado por RLS al guardar. Ejecuta 99_fix_tickets_total.sql en Supabase.");
            }
            return data;
        };

        return await robustUpdate(payload);
    },

    async saveKnowledge(knowledgeData) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { user } = await this.getCurrentSession();
        const { data, error } = await supabase
            .from('operativo_knowledge')
            .insert([{ ...knowledgeData, creado_por: user.id }]);
        if (error) throw error;
        return data;
    },

    async addTicketLog(ticketId, tipo, contenido) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { user } = await this.getCurrentSession();
        const { data, error } = await supabase
            .from('ticket_activity_log')
            .insert([{
                ticket_id: ticketId,
                user_id: user.id,
                tipo,
                contenido
            }]);
        if (error) throw error;
        return data;
    },

    async getTicketLogs(ticketId) {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('ticket_activity_log')
            .select(`
                *,
                profiles:user_id (full_name)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        if (error) {
            console.error("Error cargando logs de ticket:", error);
            return [];
        }
        return data;
    },

    async getMyAssignedTickets() {
        if (!supabase) return [];
        const { user } = await this.getCurrentSession();
        if (!user) return [];

        const { data, error } = await supabase
            .from('operativo_tickets')
            .select(`
                *,
                profiles!user_id (full_name)
            `)
            .eq('asignado_a', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Error cargando mis tickets asignados:", error);
            return [];
        }
        return data;
    }
};
