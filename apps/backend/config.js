const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
}

if (isProd && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
}

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT || 3001,
    DATABASE_URL: process.env.DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    TARIFAS_API_BASE_URL: process.env.TARIFAS_API_BASE_URL,
    TARIFAS_API_KEY: process.env.TARIFAS_API_KEY,
};
