const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

console.log('>>> [DATA] DB Connected');

const URLGEN_DISPLAY_BASE_PATH = (process.env.URLGEN_DISPLAY_BASE_PATH || 'P:\\PROYECTOS').replace(/[\\/]+$/, '');

function buildUrlgenDisplayPath(folderName) {
    return `${URLGEN_DISPLAY_BASE_PATH}\\${folderName}`;
}

function isValidUrlgenFolderName(folderName) {
    return typeof folderName === 'string' && /^[A-Z0-9_-]{1,80}$/.test(folderName);
}

function normalizeFolderJob(row, fallback = {}) {
    return {
        job_id: row?.job_id || row?.id || null,
        directorio_id: row?.directorio_id || fallback.directorio_id || null,
        folder_name: row?.folder_name || fallback.folder_name || null,
        display_path: row?.display_path || fallback.display_path || null,
        status: row?.status || fallback.status || 'not_requested',
        attempts: row?.attempts || 0,
        last_error: row?.last_error || null,
        requested_at: row?.requested_at || null,
        started_at: row?.started_at || null,
        completed_at: row?.completed_at || null,
        worker_id: row?.worker_id || null,
    };
}

async function insertSystemLog(userId, actionType, moduleName, details = {}) {
    await pool.query(
        'INSERT INTO system_logs (user_id, action_type, module_name, details, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [userId || null, actionType, moduleName, JSON.stringify(details || {})]
    );
}

async function getFolderJobByDirectorioId(directorioId) {
    const result = await pool.query(
        `SELECT id, directorio_id, folder_name, display_path, status, attempts, last_error, requested_at, started_at, completed_at, worker_id
         FROM urlgen_folder_jobs
         WHERE directorio_id = $1`,
        [directorioId]
    );
    return result.rows[0] || null;
}

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
            SELECT
                d.*,
                u.full_name as creado_por_nombre,
                j.status as folder_status,
                j.attempts as folder_attempts,
                j.last_error as folder_last_error,
                j.requested_at as folder_requested_at,
                j.started_at as folder_started_at,
                j.completed_at as folder_completed_at,
                j.worker_id as folder_worker_id
            FROM directorios_proyectos d 
            LEFT JOIN users u ON d.creado_por = u.id 
            LEFT JOIN urlgen_folder_jobs j ON j.directorio_id = d.id
            ORDER BY d.fecha_creacion DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/directorios', authenticate, async (req, res) => {
    const { nombre_directorio, credencial_usuario, nombre_proyecto, codigo_proyecto, nombre_asignado, descripcion } = req.body;
    try {
        if (!isValidUrlgenFolderName(nombre_directorio)) {
            return res.status(400).json({ error: 'El nombre del directorio contiene caracteres no permitidos.' });
        }

        const rutaCompleta = buildUrlgenDisplayPath(nombre_directorio);
        const result = await pool.query(
            `INSERT INTO directorios_proyectos (nombre_directorio, credencial_usuario, nombre_proyecto, codigo_proyecto, nombre_asignado, descripcion, ruta_completa, creado_por, fecha_creacion) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
             RETURNING *`,
            [nombre_directorio, credencial_usuario, nombre_proyecto, codigo_proyecto, nombre_asignado, descripcion, rutaCompleta, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/directorios/:id/folder-status', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const directorioResult = await pool.query(
            'SELECT id, nombre_directorio, ruta_completa FROM directorios_proyectos WHERE id = $1 LIMIT 1',
            [id]
        );

        if (!directorioResult.rows.length) {
            return res.status(404).json({ error: 'Directorio no encontrado' });
        }

        const directorio = directorioResult.rows[0];
        const job = await getFolderJobByDirectorioId(id);
        res.json(normalizeFolderJob(job, {
            directorio_id: directorio.id,
            folder_name: directorio.nombre_directorio,
            display_path: directorio.ruta_completa,
        }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/directorios/:id/request-folder', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const directorioResult = await pool.query(
            'SELECT id, nombre_directorio, ruta_completa FROM directorios_proyectos WHERE id = $1 LIMIT 1',
            [id]
        );

        if (!directorioResult.rows.length) {
            return res.status(404).json({ error: 'Directorio no encontrado' });
        }

        const directorio = directorioResult.rows[0];
        const displayPath = buildUrlgenDisplayPath(directorio.nombre_directorio);

        if (!isValidUrlgenFolderName(directorio.nombre_directorio)) {
            return res.status(400).json({ error: 'El directorio guardado contiene caracteres no permitidos para el worker privado.' });
        }

        const existingJob = await getFolderJobByDirectorioId(id);

        if (existingJob?.status === 'done') {
            return res.json(normalizeFolderJob(existingJob, {
                directorio_id: directorio.id,
                folder_name: directorio.nombre_directorio,
                display_path: displayPath,
            }));
        }

        let job;

        if (!existingJob) {
            const insertResult = await pool.query(
                `INSERT INTO urlgen_folder_jobs (directorio_id, folder_name, display_path, status, attempts, last_error, requested_by, requested_at)
                 VALUES ($1, $2, $3, 'pending', 0, NULL, $4, NOW())
                 RETURNING *`,
                [directorio.id, directorio.nombre_directorio, displayPath, req.user.id]
            );
            job = insertResult.rows[0];
        } else {
            const updateResult = await pool.query(
                `UPDATE urlgen_folder_jobs
                 SET folder_name = $2,
                     display_path = $3,
                     status = 'pending',
                     last_error = NULL,
                     requested_by = $4,
                     requested_at = NOW(),
                     started_at = NULL,
                     completed_at = NULL,
                     worker_id = NULL
                 WHERE directorio_id = $1
                 RETURNING *`,
                [directorio.id, directorio.nombre_directorio, displayPath, req.user.id]
            );
            job = updateResult.rows[0];
        }

        await pool.query(
            'UPDATE directorios_proyectos SET ruta_completa = $2 WHERE id = $1',
            [directorio.id, displayPath]
        );

        await insertSystemLog(req.user.id, 'FOLDER_REQUEST', 'URLGEN', {
            directorio_id: directorio.id,
            directorio: directorio.nombre_directorio,
            display_path: displayPath,
            retry: Boolean(existingJob),
        });

        res.status(202).json(normalizeFolderJob(job, {
            directorio_id: directorio.id,
            folder_name: directorio.nombre_directorio,
            display_path: displayPath,
        }));
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
        await insertSystemLog(req.user.id, action_type, module_name, details);
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
