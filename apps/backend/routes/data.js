const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

console.log('>>> [DATA] DB Connected');

// Middleware de autenticación
const authenticate = (req, res, next) => {
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

// Middleware de admin
const requireAdmin = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT role FROM user_roles WHERE user_id = $1',
            [req.user.id]
        );
        if (!result.rows.length || result.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Error verifying role' });
    }
};

// --- ARTICULOS ---
router.get('/articulos', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM articulos ORDER BY fecha_creacion DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/articulos', authenticate, async (req, res) => {
    const { referencia, descripcion, familia, tipo, variante, ancho, alto, nombre, precio, stock } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO articulos (referencia, descripcion, familia, tipo, variante, ancho, alto, creado_por, fecha_creacion, nombre, precio, stock) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11) 
             RETURNING *`,
            [referencia || nombre, descripcion, familia, tipo, variante, 
             ancho !== undefined ? ancho : null, 
             alto !== undefined ? alto : null, 
             req.user.id, nombre, precio, stock]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TICKETS ---
router.get('/tickets', authenticate, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 200, 500);
        const offset = parseInt(req.query.offset) || 0;
        const result = await pool.query(`
            SELECT t.*, u.full_name 
            FROM operativo_tickets t 
            LEFT JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/tickets', authenticate, async (req, res) => {
    const { titulo, descripcion, prioridad, modulo, estado, origen_falla } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO operativo_tickets (user_id, titulo, descripcion, prioridad, modulo, estado, origen_falla, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
             RETURNING *`,
            [req.user.id, titulo, descripcion, prioridad || 'Normal', modulo || 'General', estado || 'Pendiente', origen_falla]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/tickets/:id/status', authenticate, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updateFields = {};
        if (status === 'Resuelto') {
            updateFields.resuelto_at = new Date().toISOString();
        }
        if (status === 'Archivado') {
            updateFields.archivado = true;
        }

        const result = await pool.query(
            `UPDATE operativo_tickets 
             SET estado = $1, 
                 resuelto_at = COALESCE($2, resuelto_at), 
                 archivado = COALESCE($3, archivado) 
             WHERE id = $4 
             RETURNING *`,
            [status, updateFields.resuelto_at || null, updateFields.archivado !== undefined ? updateFields.archivado : null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/tickets/:id/assign', authenticate, async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE operativo_tickets SET asignado_a = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [user_id || null, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/tickets/:id/archive', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE operativo_tickets SET archivado = true, estado = 'Archivado', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/tickets/:id/priority', authenticate, async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    try {
        const result = await pool.query(
            `UPDATE operativo_tickets SET prioridad = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [priority, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/tickets/:id/diagnosis', authenticate, async (req, res) => {
    const { id } = req.params;
    const { origen_falla, gravedad_real, accion_inmediata, notas_diagnostico } = req.body;
    try {
        const result = await pool.query(
            `UPDATE operativo_tickets 
             SET origen_falla = $1, gravedad_real = $2, accion_inmediata = $3, notas_diagnostico = $4, 
                 diagnosticado_at = COALESCE(diagnosticado_at, NOW()), diagnosticado_por = $5, updated_at = NOW() 
             WHERE id = $6 RETURNING *`,
            [origen_falla, gravedad_real, accion_inmediata, notas_diagnostico, req.user.id, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TICKET LOGS ---
router.get('/tickets/:id/logs', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT tal.*, u.full_name 
             FROM ticket_activity_log tal 
             LEFT JOIN users u ON tal.user_id = u.id 
             WHERE tal.ticket_id = $1 
             ORDER BY tal.created_at ASC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/tickets/:id/logs', authenticate, async (req, res) => {
    const { id } = req.params;
    const { tipo, contenido } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO ticket_activity_log (ticket_id, user_id, tipo, contenido, created_at) 
             VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
            [id, req.user.id, tipo, contenido]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DIRECTORIOS ---
router.get('/directorios', authenticate, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 200, 500);
        const offset = parseInt(req.query.offset) || 0;
        const result = await pool.query(`
            SELECT d.*, u.full_name as creado_por_nombre 
            FROM directorios_proyectos d 
            LEFT JOIN users u ON d.creado_por = u.id 
            ORDER BY d.fecha_creacion DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/directorios', authenticate, async (req, res) => {
    const { nombre_directorio, credencial_usuario, nombre_proyecto, codigo_proyecto, nombre_asignado, descripcion, ruta_completa } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO directorios_proyectos (nombre_directorio, credencial_usuario, nombre_proyecto, codigo_proyecto, nombre_asignado, descripcion, ruta_completa, creado_por, fecha_creacion) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
             RETURNING *`,
            [nombre_directorio, credencial_usuario, nombre_proyecto, codigo_proyecto, nombre_asignado, descripcion, ruta_completa, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- COUNTS ---
router.get('/counts', authenticate, async (req, res) => {
    try {
        const [articles, dirs, logs] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM articulos'),
            pool.query('SELECT COUNT(*) FROM directorios_proyectos'),
            pool.query('SELECT COUNT(*) FROM system_logs')
        ]);

        res.json({
            articles: parseInt(articles.rows[0].count),
            dirs: parseInt(dirs.rows[0].count),
            logs: parseInt(logs.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- KNOWLEDGE ---
router.post('/knowledge', authenticate, async (req, res) => {
    const { ticket_id, categoria, problema, solucion, leccion_aprendida, titulo, contenido, tags } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO operativo_knowledge (creado_por, ticket_id, titulo, categoria, problema, solucion, contenido, tags, leccion_aprendida, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
            [req.user.id, ticket_id, titulo || problema, categoria, problema, solucion, contenido, tags, leccion_aprendida]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PANEL CONFIG ---
router.get('/panel-config', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM panel_config ORDER BY sort_order ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/panel-config', authenticate, requireAdmin, async (req, res) => {
    const configs = req.body;
    if (!Array.isArray(configs)) {
        return res.status(400).json({ error: 'Se espera un array de configuraciones' });
    }
    try {
        const updated = [];
        for (const cfg of configs) {
            const result = await pool.query(
                `UPDATE panel_config SET enabled = $1, visible_roles = $2, sort_order = $3, updated_at = NOW() 
                 WHERE panel_id = $4 RETURNING *`,
                [cfg.enabled, cfg.visible_roles, cfg.sort_order, cfg.panel_id]
            );
            if (result.rows.length > 0) {
                updated.push(result.rows[0]);
            }
        }
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LOGS ---
router.post('/logs', authenticate, async (req, res) => {
    const { action_type, module_name, details } = req.body;
    try {
        await pool.query(
            'INSERT INTO system_logs (user_id, action_type, module_name, details, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [req.user.id, action_type, module_name, JSON.stringify(details || {})]
        );
        res.sendStatus(201);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.get('/logs', authenticate, requireAdmin, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
        const offset = parseInt(req.query.offset) || 0;
        const result = await pool.query(`
            SELECT l.*, u.full_name 
            FROM system_logs l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY l.created_at DESC 
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
