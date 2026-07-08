const isProd = process.env.NODE_ENV === 'production';

function requireEnv(name, { productionOnly = false } = {}) {
    const value = process.env[name];
    if ((!productionOnly || isProd) && !value) {
        throw new Error(`${name} is required${productionOnly ? ' in production' : ''}`);
    }
    return value;
}

function getJwtSecret() {
    const value = requireEnv('JWT_SECRET', { productionOnly: true });
    if (value) return value;

    if (!process.env.SUPPRESS_DEV_SECRET_WARNING) {
        console.warn('[CONFIG] JWT_SECRET no configurado. Usando clave temporal solo para desarrollo local.');
    }
    return 'dev-only-change-me-before-deploy';
}

module.exports = {
    isProd,
    JWT_SECRET: getJwtSecret(),
    PORT: process.env.PORT || 3001,
    DATABASE_URL: requireEnv('DATABASE_URL', { productionOnly: true }),
    CORS_ORIGIN: process.env.CORS_ORIGIN || (isProd ? undefined : '*'),
    TARIFAS_API_BASE_URL: process.env.TARIFAS_API_BASE_URL,
    TARIFAS_API_KEY: process.env.TARIFAS_API_KEY,
};
