const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { getAvailableProvider } = require('../services/llm/circuit-breaker');
const { retrieve, buildRAGPrompt } = require('../services/rag/retriever');
const LLMFactory = require('../services/llm/factory');

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

/**
 * Helper: envía error SSE y cierra la conexión
 */
function sseError(res, message, statusCode = 200) {
    if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
        res.end();
        return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
    res.end();
}

/**
 * POST /api/chat
 * Endpoint principal con SSE streaming.
 */
router.post('/', authenticate, async (req, res) => {
    const { messages, provider: preferredProvider, model, temperature, useRag, sessionId } = req.body;

    try {
        let provider;
        try {
            provider = await getAvailableProvider(preferredProvider || process.env.DEFAULT_LLM_PROVIDER || 'lmstudio');
        } catch (err) {
            return sseError(res, `Sin proveedores LLM disponibles. Comprueba las IPs en el .env. (${err.message})`);
        }

        // Configurar SSE una sola vez
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        let ragSources = [];
        let processedMessages = [...messages];

        // Lógica RAG (solo si está activado y hay query)
        if (useRag) {
            try {
                const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                if (lastUserMessage) {
                    ragSources = await retrieve(lastUserMessage.content);
                    if (ragSources.length > 0) {
                        const enrichedPrompt = buildRAGPrompt(lastUserMessage.content, ragSources);
                        const lastIndex = processedMessages.findLastIndex(m => m.role === 'user');
                        processedMessages[lastIndex] = { ...processedMessages[lastIndex], content: enrichedPrompt };
                    }
                }
            } catch (ragErr) {
                console.warn('RAG falló (continuando sin contexto):', ragErr.message);
                // No lanzamos el error — el chat funciona sin RAG
            }
        }


        // Streaming de tokens
        const stream = provider.stream({ messages: processedMessages, model, temperature });

        for await (const token of stream) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }

        // Fin del stream
        res.write(`data: ${JSON.stringify({
            done: true,
            provider: provider.constructor.name,
            ragSources: ragSources.map(s => ({ source: s.source, similarity: s.similarity }))
        })}\n\n`);
        res.end();

    } catch (error) {
        console.error('Chat error:', error);
        sseError(res, error.message || 'Error interno del servidor');
    }
});

/**
 * GET /api/chat/providers
 */
router.get('/providers', authenticate, async (req, res) => {
    const providerNames = LLMFactory.listProviders();
    const statusPromises = providerNames.map(async name => {
        try {
            const provider = LLMFactory.getProvider(name);
            if (!provider) return { name, available: false, error: 'Not implemented' };
            const health = await provider.healthCheck();
            return { name, ...health };
        } catch (err) {
            return { name, available: false, error: err.message };
        }
    });

    const results = await Promise.all(statusPromises);
    res.json(results);
});

module.exports = router;
