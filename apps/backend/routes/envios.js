const express = require('express');
const {
    getRoutes,
    getTariffs,
    createQuote,
} = require('../services/envios/staticTarifas');

const router = express.Router();

function handleEnviosError(res, error) {
    const status = error.status || 500;
    const payload = {
        error: error.message || 'No se pudo completar la operacion de envios.',
        code: error.code || 'ENVIOS_ERROR',
    };

    if (status === 422 && Array.isArray(error.details)) {
        payload.details = error.details;
    }

    res.status(status).json(payload);
}

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'envios-static' });
});

router.get('/routes', (req, res) => {
    const { mode, origin } = req.query;

    if (!mode) {
        return res.status(400).json({
            error: 'El parametro mode es obligatorio.',
            code: 'MODE_REQUIRED',
        });
    }

    try {
        const data = getRoutes({ mode, origin });
        res.json(data);
    } catch (error) {
        handleEnviosError(res, error);
    }
});

router.get('/tariffs', (req, res) => {
    const { mode, origin, destination } = req.query;

    if (!mode) {
        return res.status(400).json({
            error: 'El parametro mode es obligatorio.',
            code: 'MODE_REQUIRED',
        });
    }

    try {
        const data = getTariffs({ mode, origin, destination });
        res.json(data);
    } catch (error) {
        handleEnviosError(res, error);
    }
});

router.post('/quote', (req, res) => {
    try {
        const data = createQuote(req.body || {});
        res.json(data);
    } catch (error) {
        handleEnviosError(res, error);
    }
});

module.exports = router;
