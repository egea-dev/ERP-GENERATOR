const express = require('express');
const jwt = require('jsonwebtoken');
const {
    calculateMargen,
    calculateCantidad,
    calculateCortinero,
    calculatePapelPintado,
    calculateSuelo,
    calculatePersianas,
    calculateRodapies,
    calculateDescuentos,
    calculatePresupuesto,
    calculatePrecioHora,
    convertUnidades,
    convertMedidas,
    convertMoneda,
    calculateIluminacion,
    calculateAreaPared,
    calculateEscalera,
    saveCalculation,
    getCalculatorHistory
} = require('../services/calculadoraService');

const router = express.Router();

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

const calculators = {
    margen: calculateMargen,
    cantidad: calculateCantidad,
    cortinero: calculateCortinero,
    papel: calculatePapelPintado,
    suelo: calculateSuelo,
    persianas: calculatePersianas,
    rodapies: calculateRodapies,
    descuentos: calculateDescuentos,
    presupuesto: calculatePresupuesto,
    preciohora: calculatePrecioHora,
    unidades: convertUnidades,
    medidas: convertMedidas,
    moneda: convertMoneda,
    iluminacion: calculateIluminacion,
    pared: calculateAreaPared,
    escalera: calculateEscalera
};

router.post('/calculate', authenticate, async (req, res) => {
    const { type, inputs } = req.body;
    
    if (!type || !inputs) {
        return res.status(400).json({ error: 'Type e inputs son requeridos' });
    }
    
    const calculator = calculators[type];
    if (!calculator) {
        return res.status(400).json({ error: `Calculadora ${type} no encontrada` });
    }
    
    try {
        const outputs = calculator(inputs);
        
        await saveCalculation(req.user.id, type, inputs, outputs);
        
        res.json({ success: true, outputs });
    } catch (err) {
        console.error('[CALCULADORA] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/history/:type?', authenticate, async (req, res) => {
    const { type } = req.params;
    
    try {
        const history = await getCalculatorHistory(req.user.id, type || null);
        res.json(history);
    } catch (err) {
        console.error('[CALCULADORA] Error getting history:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/health', (_req, res) => {
    res.json({ status: 'ok', calculators: Object.keys(calculators) });
});

module.exports = router;
