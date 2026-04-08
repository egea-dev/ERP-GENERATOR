const path = require('path');
const fs = require('fs');

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
}

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'default-dev-secret',
    PORT: process.env.PORT || 3001,
    DATABASE_URL: process.env.DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    TARIFAS_API_BASE_URL: process.env.TARIFAS_API_BASE_URL,
    TARIFAS_API_KEY: process.env.TARIFAS_API_KEY,
};
