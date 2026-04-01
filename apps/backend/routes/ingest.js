const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { ingest } = require('../services/rag/ingestor');

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

router.post('/ingest', authenticate, async (req, res) => {
    const { content, source, filename, metadata } = req.body;

    if (!content || !source) {
        return res.status(400).json({ 
            error: 'Se requiere contenido y nombre de la fuente.' 
        });
    }

    try {
        const result = await ingest(content, source, { 
            filename, 
            ...metadata,
            ingestedAt: new Date().toISOString()
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error en endpoint de ingesta:', error);
        res.status(500).json({ 
            error: 'Fallo al procesar el documento.',
            details: error.message 
        });
    }
});

module.exports = router;
