import { buildApiUrl } from './apiConfig';

// Cache con TTL y LRU eviction
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 100; // Límite máximo de entradas en cache
const MAX_LOG_RETRIES = 3;

// Cola de logs pendientes para auditoría
let pendingLogs = [];
let isFlushingLogs = false;

function getCached(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        cache.delete(key);
        cache.set(key, cached);
        return cached.data;
    }
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
    cache.set(key, { data, timestamp: Date.now() });
}

function clearCache() {
    cache.clear();
}

// Ayudante para peticiones fetch con token, timeout y retry
const fetchAPI = async (endpoint, options = {}, retries = 2) => {
    const token = localStorage.getItem('erp_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(buildApiUrl(endpoint), {
            ...options,
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { error: `Error ${response.status}: ${response.statusText}` };
            }
            const requestError = new Error(errorData.error || errorData.message || `Error en la petición (${response.status})`);
            requestError.status = response.status;
            requestError.code = errorData.code;
            requestError.data = errorData;
            throw requestError;
        }

        const data = await response.json();

        if (response.ok && !data && !options.skipValidation) {
            console.warn(`Respuesta vacía para ${endpoint}`);
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        // Only retry GET requests to avoid duplicate POSTs
        if (retries > 0 && (error.name === 'TypeError' || error.name === 'AbortError') && (!options.method || options.method === 'GET')) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
            return fetchAPI(endpoint, options, retries - 1);
        }

        if (error.name === 'AbortError') {
            throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
        }

        throw error;
    }
};

// Ayudante para requests con cache
async function fetchWithCache(endpoint, options = {}, cacheKey) {
    if (cacheKey && !options.method) {
        const cached = getCached(cacheKey);
        if (cached) return cached;
    }
    const result = await fetchAPI(endpoint, options);
    if (cacheKey && result) {
        setCache(cacheKey, result);
    }
    return result;
}

// Función para invalidar cache
export function invalidateCache(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

// Función para vaciar la cola de logs pendientes con límite de reintentos
async function flushPendingLogs() {
    if (isFlushingLogs || pendingLogs.length === 0) return;
    isFlushingLogs = true;

    const logsToFlush = [...pendingLogs];
    pendingLogs = [];

    try {
        for (const log of logsToFlush) {
            if ((log._retries || 0) >= MAX_LOG_RETRIES) continue;
            try {
                await fetchAPI('/data/logs', {
                    method: 'POST',
                    body: JSON.stringify(log)
                });
            } catch {
                log._retries = (log._retries || 0) + 1;
                pendingLogs.push(log);
            }
        }
    } finally {
        isFlushingLogs = false;
    }
}

export const dbService = {
    // --- AUTENTICACIÓN ---
    async login(email, password) {
        if (!email || !password) {
            throw new Error('Email y contraseña son obligatorios');
        }
        const data = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (!data.token) {
            throw new Error('Respuesta de autenticación inválida');
        }
        localStorage.setItem('erp_token', data.token);
        return data.user;
    },

    async logout() {
        localStorage.removeItem('erp_token');
        clearCache();
        pendingLogs = [];
    },

    async getCurrentSession() {
        const token = localStorage.getItem('erp_token');
        if (!token) return { session: null, user: null };
        try {
            const data = await fetchAPI('/auth/me');
            return { session: { access_token: token }, user: data.user };
        } catch (e) {
            localStorage.removeItem('erp_token');
            return { session: null, user: null };
        }
    },

    // --- PERFILES Y ROLES ---
    async getUserRole(userId) {
        try {
            const data = await fetchAPI(`/auth/role/${userId}`);
            return data.role || 'user';
        } catch (e) {
            console.warn('No se pudo obtener el rol del usuario:', e.message);
            return 'user';
        }
    },

    // --- ARTICULOS ---
    async getArticulos() {
        return await fetchWithCache('/data/articulos', {}, 'articulos:all');
    },

    async saveArticulo(artData) {
        if (!artData || !artData.referencia) {
            throw new Error('Datos de artículo inválidos');
        }
        invalidateCache('articulos:');
        return await fetchAPI('/data/articulos', {
            method: 'POST',
            body: JSON.stringify(artData)
        });
    },

    // --- TICKETS ---
    async getTickets() {
        return await fetchWithCache('/data/tickets', {}, 'tickets:all');
    },

    async updateTicketStatus(ticketId, status) {
        if (!ticketId || !status) {
            throw new Error('ID de ticket y estado son obligatorios');
        }
        invalidateCache('tickets:');
        return await fetchAPI(`/data/tickets/${ticketId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    async createTicket(ticketData) {
        if (!ticketData || !ticketData.titulo) {
            throw new Error('Datos de ticket inválidos');
        }
        invalidateCache('tickets:');
        return await fetchAPI('/data/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData)
        });
    },

    // Alias para compatibilidad con TicketModal
    async saveTicket(ticketData) {
        return this.createTicket(ticketData);
    },

    async getMyAssignedTickets() {
        const { user } = await this.getCurrentSession();
        if (!user) return [];
        const allTickets = await this.getTickets();
        return allTickets.filter(t => t.asignado_a === user.id && !t.archivado);
    },

    async assignTicket(ticketId, userId, notes) {
        if (!ticketId) {
            throw new Error('ID de ticket es obligatorio');
        }
        invalidateCache('tickets:');
        return await fetchAPI(`/data/tickets/${ticketId}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ user_id: userId, notes })
        });
    },

    async archiveTicket(ticketId) {
        if (!ticketId) {
            throw new Error('ID de ticket es obligatorio');
        }
        invalidateCache('tickets:');
        return await fetchAPI(`/data/tickets/${ticketId}/archive`, {
            method: 'PUT'
        });
    },

    async updateTicketPriority(ticketId, priority) {
        if (!ticketId || !priority) {
            throw new Error('ID de ticket y prioridad son obligatorios');
        }
        invalidateCache('tickets:');
        return await fetchAPI(`/data/tickets/${ticketId}/priority`, {
            method: 'PUT',
            body: JSON.stringify({ priority })
        });
    },

    // --- TICKET LOGS ---
    async getTicketLogs(ticketId) {
        return await fetchAPI(`/data/tickets/${ticketId}/logs`);
    },

    async addTicketLog(ticketId, tipo, contenido) {
        if (!ticketId || !tipo) {
            throw new Error('ID de ticket y tipo son obligatorios');
        }
        return await fetchAPI(`/data/tickets/${ticketId}/logs`, {
            method: 'POST',
            body: JSON.stringify({ tipo, contenido })
        });
    },

    // --- DIAGNÓSTICO ---
    async saveMasterDiagnosis(ticketId, data) {
        if (!ticketId || !data) {
            throw new Error('ID de ticket y datos de diagnóstico son obligatorios');
        }
        invalidateCache('tickets:');
        return await fetchAPI(`/data/tickets/${ticketId}/diagnosis`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // --- KNOWLEDGE BASE ---
    async saveKnowledge(knowledgeData) {
        if (!knowledgeData) {
            throw new Error('Datos de conocimiento inválidos');
        }
        return await fetchAPI('/data/knowledge', {
            method: 'POST',
            body: JSON.stringify(knowledgeData)
        });
    },

    // --- LOGS Y AUDITORÍA ---
    async insertLog(actionType, moduleName, details = {}) {
        const logEntry = {
            action_type: actionType,
            module_name: moduleName,
            details,
            timestamp: new Date().toISOString()
        };

        try {
            const { user } = await this.getCurrentSession();
            logEntry.user_id = user?.id;
        } catch {
            // Continuar sin user_id
        }

        pendingLogs.push(logEntry);
        flushPendingLogs().catch(() => {});
    },

    async logSystemAction(actionType, moduleName, details = {}) {
        const logEntry = {
            action_type: actionType,
            module_name: moduleName,
            details,
            timestamp: new Date().toISOString()
        };

        try {
            const { user } = await this.getCurrentSession();
            logEntry.user_id = user?.id;
        } catch {
            // Continuar sin user_id
        }

        pendingLogs.push(logEntry);
        flushPendingLogs().catch(() => {});
    },

    async getAllLogs() {
        return await fetchWithCache('/data/logs', {}, 'logs:all');
    },

    // --- DIRECTORIOS ---
    async getCounts() {
        return await fetchWithCache('/data/counts', {}, 'data:counts');
    },

    async getDirectorios() {
        return await fetchWithCache('/data/directorios', {}, 'directorios:all');
    },

    async saveDirectorio(dirData) {
        if (!dirData || (!dirData.ruta_completa && !dirData.nombre_directorio)) {
            throw new Error('Datos de directorio inválidos');
        }
        invalidateCache('directorios:');
        invalidateCache('data:');
        return await fetchAPI('/data/directorios', {
            method: 'POST',
            body: JSON.stringify(dirData)
        });
    },

    // --- PERFILES ---
    async getProfilesWithRoles() {
        return await fetchWithCache('/auth/profiles', {}, 'profiles:all');
    },

    // --- GESTIÓN DE USUARIOS ---
    async createNewUser(email, password, fullName, role) {
        if (!email || !password || !fullName) {
            throw new Error('Email, contraseña y nombre completo son obligatorios');
        }
        const result = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name: fullName })
        });
        if (role && role !== 'user') {
            await fetchAPI(`/auth/users/${result.id}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role })
            });
        }
        invalidateCache('profiles:');
        return result;
    },

    async updateUserRole(userId, newRole) {
        if (!userId || !newRole) {
            throw new Error('ID de usuario y rol son obligatorios');
        }
        invalidateCache('profiles:');
        return await fetchAPI(`/auth/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role: newRole })
        });
    },

    async deleteUser(userId) {
        if (!userId) {
            throw new Error('ID de usuario es obligatorio');
        }
        invalidateCache('profiles:');
        return await fetchAPI(`/auth/users/${userId}`, {
            method: 'DELETE'
        });
    },

    // --- TARIFAS ---
    async getProveedores() {
        return await fetchWithCache('/tarifas/proveedores', {}, 'tarifas:proveedores');
    },

    async createProveedor(nombre) {
        if (!nombre || !nombre.trim()) {
            throw new Error('Nombre del proveedor es obligatorio');
        }
        invalidateCache('tarifas:');
        return await fetchAPI('/tarifas/proveedores', {
            method: 'POST',
            body: JSON.stringify({ nombre: nombre.trim() })
        });
    },

    async deleteProveedor(id) {
        if (!id) {
            throw new Error('ID de proveedor es obligatorio');
        }
        invalidateCache('tarifas:');
        return await fetchAPI(`/tarifas/proveedores/${id}`, {
            method: 'DELETE'
        });
    },

    async getTarifas(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.version_id) params.append('version_id', filtros.version_id);
        if (filtros.proveedor_id) params.append('proveedor_id', filtros.proveedor_id);
        if (filtros.familia) params.append('familia', filtros.familia);
        if (filtros.year) params.append('year', filtros.year);
        if (filtros.search) params.append('search', filtros.search);

        const query = params.toString();
        const cacheKey = `tarifas:${query}`;
        return await fetchWithCache(`/tarifas${query ? '?' + query : ''}`, {}, cacheKey);
    },

    async saveTarifas(tarifas) {
        if (!Array.isArray(tarifas) || tarifas.length === 0) {
            throw new Error('Lista de tarifas inválida');
        }
        invalidateCache('tarifas:');
        return await fetchAPI('/tarifas', {
            method: 'POST',
            body: JSON.stringify(tarifas)
        });
    },

    async importTarifaVersion(payload) {
        if (!payload || !Array.isArray(payload.tarifas) || payload.tarifas.length === 0) {
            throw new Error('Importación de tarifas inválida');
        }
        invalidateCache('tarifas:');
        return await fetchAPI('/tarifas/import', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    async getTarifaVersiones(proveedorId) {
        if (!proveedorId) {
            throw new Error('ID de proveedor es obligatorio');
        }
        return await fetchWithCache(`/tarifas/versiones?proveedor_id=${encodeURIComponent(proveedorId)}`, {}, `tarifas:versiones:${proveedorId}`);
    },

    async activateTarifaVersion(versionId) {
        if (!versionId) {
            throw new Error('ID de versión es obligatorio');
        }
        invalidateCache('tarifas:');
        return await fetchAPI(`/tarifas/versiones/${versionId}/activate`, {
            method: 'POST'
        });
    },

    async deleteTarifaVersion(versionId) {
        if (!versionId) {
            throw new Error('ID de versión es obligatorio');
        }
        invalidateCache('tarifas:');
        return await fetchAPI(`/tarifas/versiones/${versionId}`, {
            method: 'DELETE'
        });
    },

    async getTarifaVersionExportData(versionId) {
        if (!versionId) {
            throw new Error('ID de versión es obligatorio');
        }
        return await fetchAPI(`/tarifas/versiones/${versionId}/export-data`);
    },

    async getFamilias(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.version_id) params.append('version_id', filtros.version_id);
        if (filtros.proveedor_id) params.append('proveedor_id', filtros.proveedor_id);
        if (filtros.year) params.append('year', filtros.year);
        const query = params.toString();
        return await fetchWithCache(`/tarifas/familias${query ? '?' + query : ''}`, {}, `tarifas:familias:${query}`);
    },

    async getAnos(proveedorId) {
        const query = proveedorId ? `?proveedor_id=${encodeURIComponent(proveedorId)}` : '';
        return await fetchWithCache(`/tarifas/anos${query}`, {}, `tarifas:anos:${proveedorId || 'all'}`);
    },

    // --- ENVIOS ---
    async getEnviosHealth() {
        return await fetchWithCache('/envios/health', {}, 'envios:health');
    },

    async getEnviosRoutes({ mode, origin } = {}) {
        if (!mode) {
            throw new Error('El modo de envío es obligatorio');
        }

        const params = new URLSearchParams({ mode });
        if (origin) params.append('origin', origin);

        const query = params.toString();
        return await fetchWithCache(`/envios/routes?${query}`, {}, `envios:routes:${query}`);
    },

    async getEnviosTariffs({ mode, origin, destination } = {}) {
        if (!mode) {
            throw new Error('El modo de envío es obligatorio');
        }

        const params = new URLSearchParams({ mode });
        if (origin) params.append('origin', origin);
        if (destination) params.append('destination', destination);

        const query = params.toString();
        return await fetchWithCache(`/envios/tariffs?${query}`, {}, `envios:tariffs:${query}`);
    },

    async createEnviosQuote(payload) {
        if (!payload || !payload.mode) {
            throw new Error('El payload del envío es obligatorio');
        }

        return await fetchAPI('/envios/quote', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // --- PANEL CONFIG ---
    async getPanelConfig() {
        return await fetchAPI('/data/panel-config');
    },

    async updatePanelConfig(configs) {
        if (!Array.isArray(configs)) {
            throw new Error('Configuración de paneles inválida');
        }
        return await fetchAPI('/data/panel-config', {
            method: 'PUT',
            body: JSON.stringify(configs)
        });
    }
};
