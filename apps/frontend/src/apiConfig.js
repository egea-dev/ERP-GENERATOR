const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const envApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || '');
const envApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '');

const derivedApiBaseUrl = envApiBaseUrl || (envApiUrl ? envApiUrl.replace(/\/api$/, '') : '');

export const API_URL = envApiUrl || (derivedApiBaseUrl ? `${derivedApiBaseUrl}/api` : '/api');
export const API_BASE_URL = derivedApiBaseUrl;

const normalizePath = (path) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (path) => `${API_URL}${normalizePath(path)}`;
export const buildApiBaseUrl = (path) => `${API_BASE_URL}${normalizePath(path)}`;
