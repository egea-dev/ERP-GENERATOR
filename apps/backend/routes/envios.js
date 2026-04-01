const express = require('express');
const {
    getHealth,
    getRoutes,
    getTariffs,
    createQuote,
} = require('../services/envios/externalTarifasApi');

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

router.get('/health', async (_req, res) => {
    try {
        const data = await getHealth();
        res.json(data);
    } catch (error) {
        handleEnviosError(res, error);
    }
});

router.get('/routes', async (req, res) => {
    const { mode, origin } = req.query;

    if (!mode) {
        return res.status(400).json({
            error: 'El parametro mode es obligatorio.',
            code: 'MODE_REQUIRED',
        });
    }

    try {
        const data = await getRoutes({ mode, origin });
        res.json(data);
    } catch (error) {
        handleEnviosError(res, error);
    }
});

router.get('/tariffs', async (req, res) => {
    const { mode, origin, destination } = req.query;

    if (!mode) {
        return res.status(400).json({
            error: 'El parametro mode es obligatorio.',
            code: 'MODE_REQUIRED',
        });
    }

    try {
        const data = await getTariffs({ mode, origin, destination });
        res.json(data);
    } catch (error) {
        handleEnviosError(res, error);
    }
});

router.post('/quote', async (req, res) => {
    try {
        const data = await createQuote(req.body || {});
        res.json(data);
    } catch (error) {
        handleEnviosError(res, error);
    }
});

module.exports = router;
