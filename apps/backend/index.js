const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, PORT, CORS_ORIGIN } = require('./config');
const chatRouter = require('./routes/chat');
const healthRouter = require('./routes/health');
const ingestRouter = require('./routes/ingest');
const authRouter = require('./routes/auth');
const dataRouter = require('./routes/data');
const tarifasRouter = require('./routes/tarifas');
const enviosRouter = require('./routes/envios');
const seedAdminUser = require('./seedAdmin');

const app = express();

// Seed admin user on startup
seedAdminUser().catch((err) => console.error('[SEED] Error:', err.message));

const app = express();

// CORS
const corsOrigin = !CORS_ORIGIN || CORS_ORIGIN === '*'
    ? true
    : CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));

// Logger (sanitized)
app.use((req, res, next) => {
    const sanitizedPath = req.url.split('?')[0];
    console.log(`[REQUEST] ${new Date().toISOString()} ${req.method} ${sanitizedPath}`);
    next();
});

// Parsing
app.use(express.json({ limit: '1mb' }));

// JWT verification middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Admin role check middleware
const requireAdmin = async (req, res, next) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const result = await pool.query(
            'SELECT role FROM user_roles WHERE user_id = $1',
            [req.user.id]
        );
        await pool.end();
        if (!result.rows.length || result.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Error verifying role' });
    }
};

// Public Routes
app.use('/api/auth', authRouter);

// Protected Routes
app.use('/api/chat', authenticateToken, chatRouter);
app.use('/api/chat', authenticateToken, healthRouter);
app.use('/api/chat', authenticateToken, ingestRouter);
app.use('/api/data', authenticateToken, dataRouter);
app.use('/api/tarifas', authenticateToken, tarifasRouter);
app.use('/api/envios', authenticateToken, enviosRouter);

// Health (public)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ERP-GENERATOR' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', path: req.url });
});

// Export app for Vercel Serverless
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
