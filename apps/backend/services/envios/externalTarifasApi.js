const { TARIFAS_API_BASE_URL, TARIFAS_API_KEY } = require('../../config');

const REQUEST_TIMEOUT_MS = 15000;

class ExternalTarifasApiError extends Error {
    constructor(message, { status = 500, code = 'EXTERNAL_TARIFAS_API_ERROR', details = null } = {}) {
        super(message);
        this.name = 'ExternalTarifasApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function trimTrailingSlash(value = '') {
    return String(value).replace(/\/+$/, '');
}

function ensureConfig() {
    if (!TARIFAS_API_BASE_URL) {
        throw new ExternalTarifasApiError(
            'El servicio de envios no esta configurado todavia. Contacta con soporte.',
            { status: 503, code: 'ENVIOS_CONFIG_MISSING' }
        );
    }

    if (!TARIFAS_API_KEY) {
        throw new ExternalTarifasApiError(
            'La conexion segura con el servicio de envios no esta disponible. Contacta con soporte.',
            { status: 503, code: 'ENVIOS_API_KEY_MISSING' }
        );
    }
}

function buildUrl(path, query = {}) {
    const url = new URL(`${trimTrailingSlash(TARIFAS_API_BASE_URL)}${path}`);

    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    return url;
}

async function parseResponsePayload(response) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    const text = await response.text();
    return text ? { detail: text } : null;
}

function formatValidationError(detail) {
    if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
    }

    if (Array.isArray(detail) && detail.length > 0) {
        return detail
            .map((entry) => String(entry?.msg || 'Dato no valido').replace(/^Value error,\s*/i, '').trim())
            .filter(Boolean)
            .join(' ');
    }

    return 'Revisa los datos del envio e intentalo de nuevo.';
}

function mapUpstreamError(status, payload) {
    const detail = payload?.detail;

    if (status === 401 || status === 403) {
        return {
            status: 503,
            code: 'UPSTREAM_AUTH_ERROR',
            message: 'La conexion segura con el servicio de envios no esta disponible. Contacta con soporte.',
            details: null,
        };
    }

    if (status === 404) {
        return {
            status: 404,
            code: 'ROUTE_NOT_FOUND',
            message: typeof detail === 'string' && detail.trim()
                ? detail.trim()
                : 'No se encontro una ruta disponible para la combinacion seleccionada.',
            details: null,
        };
    }

    if (status === 422) {
        return {
            status: 422,
            code: 'VALIDATION_ERROR',
            message: formatValidationError(detail),
            details: Array.isArray(detail) ? detail : null,
        };
    }

    if (status >= 500) {
        return {
            status: 502,
            code: 'UPSTREAM_UNAVAILABLE',
            message: 'El servicio externo de envios no esta disponible en este momento.',
            details: null,
        };
    }

    return {
        status,
        code: 'UPSTREAM_ERROR',
        message: typeof detail === 'string' && detail.trim()
            ? detail.trim()
            : 'No se pudo completar la consulta de envios.',
        details: null,
    };
}

async function requestExternal(path, { method = 'GET', query, body } = {}) {
    ensureConfig();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(buildUrl(path, query), {
            method,
            headers: {
                Accept: 'application/json',
                'X-API-Key': TARIFAS_API_KEY,
                ...(body ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        const payload = await parseResponsePayload(response);

        if (!response.ok) {
            const mapped = mapUpstreamError(response.status, payload);
            throw new ExternalTarifasApiError(mapped.message, mapped);
        }

        return payload;
    } catch (error) {
        if (error instanceof ExternalTarifasApiError) {
            throw error;
        }

        if (error.name === 'AbortError') {
            throw new ExternalTarifasApiError(
                'El servicio de cotizacion ha tardado demasiado en responder.',
                { status: 504, code: 'UPSTREAM_TIMEOUT' }
            );
        }

        throw new ExternalTarifasApiError(
            'No se pudo conectar con el servicio externo de envios.',
            { status: 502, code: 'UPSTREAM_CONNECTION_ERROR' }
        );
    } finally {
        clearTimeout(timeoutId);
    }
}

async function getHealth() {
    return requestExternal('/health');
}

async function getRoutes({ mode, origin }) {
    return requestExternal('/routes', { query: { mode, origin } });
}

async function getTariffs({ mode, origin, destination }) {
    return requestExternal('/tariffs', { query: { mode, origin, destination } });
}

async function createQuote(payload) {
    return requestExternal('/quote', { method: 'POST', body: payload });
}

module.exports = {
    ExternalTarifasApiError,
    getHealth,
    getRoutes,
    getTariffs,
    createQuote,
};
