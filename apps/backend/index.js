require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat');
const healthRouter = require('./routes/health');
const ingestRouter = require('./routes/ingest');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de Seguridad e Instrumentación (MANUAL CORS FORCED)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    
    // Si es una petición OPTIONS, respondemos inmediatamente con 200
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Logger de peticiones
app.use((req, res, next) => {
    console.log(`>>> [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Manejo manual de preflight (OPTIONS) por si el middleware falla
app.options('*', cors());

// Parsing de JSON (Debe estar ANTES de las rutas)
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/chat', healthRouter);
app.use('/api/chat', ingestRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ERP-GENERATOR Chat Backend' });
});

// 404 Handler
app.use((req, res) => {
    console.warn(`[404] No route found for ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Ruta no encontrada', path: req.url });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
