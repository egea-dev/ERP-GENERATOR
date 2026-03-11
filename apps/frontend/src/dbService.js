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
        return data?.role || 'user'; // Rol por defecto si no estÃ¡ asignado
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
                profiles:user_id (full_name)
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
                profiles:user_id (full_name)
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
        const updates = {
            estado: nuevoEstado,
            updated_at: new Date().toISOString()
        };

        if (nuevoEstado === 'Resuelto') {
            updates.resuelto_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('operativo_tickets')
            .update(updates)
            .eq('id', ticketId);
        if (error) throw error;
        return data;
    },

    async updateTicketPriority(ticketId, nuevaPrioridad) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { data, error } = await supabase
            .from('operativo_tickets')
            .update({
                prioridad: nuevaPrioridad,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        if (error) throw error;
        return data;
    },

    async assignTicket(ticketId, tecnicoId, notas) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { data, error } = await supabase
            .from('operativo_tickets')
            .update({
                asignado_a: tecnicoId,
                notas_admin: notas,
                estado: 'En proceso',
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        if (error) throw error;
        return data;
    },

    async saveMasterDiagnosis(ticketId, diagData) {
        if (!supabase) throw new Error("Supabase no configurado");
        const { user } = await this.getCurrentSession();
        const { data, error } = await supabase
            .from('operativo_tickets')
            .update({
                ...diagData,
                estado: 'Diagnosticado',
                diagnosticado_at: new Date().toISOString(),
                diagnosticado_por: user.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        if (error) throw error;
        return data;
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
                profiles:user_id (full_name)
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
