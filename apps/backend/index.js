require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat');
const healthRouter = require('./routes/health');
const ingestRouter = require('./routes/ingest');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*', // Permitir todos los orígenes para facilitar la conexión con Vercel/Tailscale
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Logger de peticiones
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

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
