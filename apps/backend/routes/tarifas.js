const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const MAX_IMPORT_SIZE = 10000;

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalido' });
        }
        req.user = user;
        next();
    });
};

function parseOptionalInt(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function applyTarifaFilters({ versionId, proveedorId, year, familia, search }, params) {
    const clauses = [];

    if (versionId) {
        params.push(versionId);
        clauses.push(`t.version_id = $${params.length}`);
    } else {
        if (proveedorId) {
            params.push(proveedorId);
            clauses.push(`t.proveedor_id = $${params.length}`);
        }
        if (year) {
            params.push(year);
            clauses.push(`COALESCE(tv.importe_year, t.importe_year) = $${params.length}`);
        }
        clauses.push('COALESCE(tv.is_active, true) = true');
    }

    if (familia) {
        params.push(familia);
        clauses.push(`t.familia = $${params.length}`);
    }

    if (search && search.length <= 100) {
        params.push(`%${search}%`);
        clauses.push(`(t.referencia ILIKE $${params.length} OR t.articulo ILIKE $${params.length} OR t.descripcion ILIKE $${params.length})`);
    }

    return clauses;
}

async function resolveProveedorId(client, proveedorId, proveedorNombre) {
    if (proveedorId) {
        const existing = await client.query(
            'SELECT id, nombre FROM proveedores WHERE id = $1',
            [proveedorId]
        );
        if (!existing.rows.length) {
            throw new Error('El proveedor seleccionado no existe');
        }
        return existing.rows[0];
    }

    if (!proveedorNombre || !proveedorNombre.trim()) {
        throw new Error('Debes indicar un proveedor');
    }

    const inserted = await client.query(
        'INSERT INTO proveedores (nombre) VALUES ($1) RETURNING id, nombre',
        [proveedorNombre.trim()]
    );
    return inserted.rows[0];
}

router.get('/proveedores', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.nombre,
                p.created_at AS fecha_creacion,
                COALESCE(v.total_versiones, 0)::int AS total_versiones,
                COALESCE(v.versiones_activas, 0)::int AS versiones_activas,
                COALESCE(v.total_tarifas, 0)::int AS total_tarifas,
                COALESCE(v.tarifas_activas, 0)::int AS tarifas_activas,
                v.anos_disponibles,
                v.ultimo_ano,
                v.ultima_importacion
            FROM proveedores p
            LEFT JOIN (
                SELECT
                    tv.proveedor_id,
                    COUNT(*)::int AS total_versiones,
                    COUNT(*) FILTER (WHERE tv.is_active)::int AS versiones_activas,
                    ARRAY_AGG(DISTINCT tv.importe_year ORDER BY tv.importe_year DESC) AS anos_disponibles,
                    MAX(tv.importe_year) AS ultimo_ano,
                    MAX(tv.created_at) AS ultima_importacion,
                    COALESCE(SUM(tc.total_tarifas), 0)::int AS total_tarifas,
                    COALESCE(SUM(tc.total_tarifas) FILTER (WHERE tv.is_active), 0)::int AS tarifas_activas
                FROM tarifa_versiones tv
                LEFT JOIN (
                    SELECT version_id, COUNT(*)::int AS total_tarifas
                    FROM tarifas
                    GROUP BY version_id
                ) tc ON tc.version_id = tv.id
                GROUP BY tv.proveedor_id
            ) v ON v.proveedor_id = p.id
            ORDER BY p.nombre ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/proveedores', authenticate, async (req, res) => {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del proveedor es obligatorio' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO proveedores (nombre) VALUES ($1) RETURNING id, nombre, created_at',
            [nombre.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'El proveedor ya existe' });
        }
        console.error('Error al crear proveedor:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/proveedores/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM proveedores WHERE id = $1', [id]);
        res.json({ message: 'Proveedor y sus versiones eliminados' });
    } catch (err) {
        console.error('Error al eliminar proveedor:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/versiones', authenticate, async (req, res) => {
    const { proveedor_id: proveedorId } = req.query;
    if (!proveedorId) {
        return res.status(400).json({ error: 'proveedor_id es obligatorio' });
    }

    try {
        const result = await pool.query(`
            SELECT
                tv.id,
                tv.proveedor_id,
                tv.importe_year,
                tv.revision,
                tv.nombre_archivo,
                tv.notas,
                tv.is_active,
                tv.created_by,
                tv.created_at,
                tv.updated_at,
                COUNT(t.id)::int AS total_tarifas
            FROM tarifa_versiones tv
            LEFT JOIN tarifas t ON t.version_id = tv.id
            WHERE tv.proveedor_id = $1
            GROUP BY tv.id
            ORDER BY tv.importe_year DESC, tv.revision DESC
        `, [proveedorId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener versiones:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/versiones/:id/export-data', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const versionResult = await pool.query(`
            SELECT
                tv.id,
                tv.nombre_archivo,
                tv.importe_year,
                tv.revision,
                tv.source_headers,
                tv.source_rows,
                p.nombre AS proveedor_nombre
            FROM tarifa_versiones tv
            JOIN proveedores p ON p.id = tv.proveedor_id
            WHERE tv.id = $1
        `, [id]);

        if (!versionResult.rows.length) {
            return res.status(404).json({ error: 'Version no encontrada' });
        }

        const version = versionResult.rows[0];
        const sourceHeaders = Array.isArray(version.source_headers) ? version.source_headers : [];
        const sourceRows = Array.isArray(version.source_rows) ? version.source_rows : [];

        if (sourceHeaders.length && sourceRows.length) {
            return res.json({
                file_name: version.nombre_archivo || `${version.proveedor_nombre}-${version.importe_year}-rev${version.revision}.xlsx`,
                headers: sourceHeaders,
                rows: sourceRows,
                proveedor_nombre: version.proveedor_nombre,
                importe_year: version.importe_year,
                revision: version.revision,
                original_layout: true,
            });
        }

        const fallbackRows = await pool.query(`
            SELECT referencia, descripcion, familia, ancho, precio
            FROM tarifas
            WHERE version_id = $1
            ORDER BY referencia ASC
        `, [id]);

        return res.json({
            file_name: version.nombre_archivo || `${version.proveedor_nombre}-${version.importe_year}-rev${version.revision}.xlsx`,
            headers: ['Articulo', 'Descripcion', 'Familia', 'Ancho', 'Precio'],
            rows: fallbackRows.rows.map((item) => [item.referencia, item.descripcion, item.familia, item.ancho, item.precio]),
            proveedor_nombre: version.proveedor_nombre,
            importe_year: version.importe_year,
            revision: version.revision,
            original_layout: false,
        });
    } catch (err) {
        console.error('Error al preparar exportacion de version:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/import', authenticate, async (req, res) => {
    const {
        proveedor_id: proveedorId,
        proveedor_nombre: proveedorNombre,
        importe_year: importeYearRaw,
        nombre_archivo: nombreArchivo,
        source_headers: sourceHeaders,
        source_rows: sourceRows,
        notas,
        tarifas,
    } = req.body;

    const importeYear = parseOptionalInt(importeYearRaw);

    if (!importeYear || importeYear < 2000 || importeYear > 2100) {
        return res.status(400).json({ error: 'El ano de tarifa es obligatorio y debe ser valido' });
    }

    if (!Array.isArray(tarifas)) {
        return res.status(400).json({ error: 'Se espera un array de tarifas' });
    }

    if (tarifas.length === 0) {
        return res.status(400).json({ error: 'El array de tarifas esta vacio' });
    }

    if (tarifas.length > MAX_IMPORT_SIZE) {
        return res.status(400).json({ error: `Maximo ${MAX_IMPORT_SIZE} tarifas por importacion` });
    }

    const tarifasByReference = new Map();
    for (const item of tarifas) {
        if (!item || !item.referencia || !item.articulo) continue;
        if (tarifasByReference.has(item.referencia)) {
            return res.status(400).json({ error: `La importacion contiene referencias duplicadas: ${item.referencia}` });
        }
        tarifasByReference.set(item.referencia, item);
    }

    const validTarifas = Array.from(tarifasByReference.values());
    if (!validTarifas.length) {
        return res.status(400).json({ error: 'No hay tarifas validas para insertar' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const proveedor = await resolveProveedorId(client, proveedorId, proveedorNombre);

        const revisionResult = await client.query(
            'SELECT COALESCE(MAX(revision), 0) + 1 AS next_revision FROM tarifa_versiones WHERE proveedor_id = $1 AND importe_year = $2',
            [proveedor.id, importeYear]
        );
        const nextRevision = revisionResult.rows[0].next_revision;

        await client.query(
            'UPDATE tarifa_versiones SET is_active = false, updated_at = NOW() WHERE proveedor_id = $1 AND importe_year = $2 AND is_active = true',
            [proveedor.id, importeYear]
        );

        const versionResult = await client.query(
            `INSERT INTO tarifa_versiones (proveedor_id, importe_year, revision, nombre_archivo, source_headers, source_rows, notas, is_active, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
             RETURNING *`,
            [
                proveedor.id,
                importeYear,
                nextRevision,
                nombreArchivo || null,
                JSON.stringify(Array.isArray(sourceHeaders) ? sourceHeaders : []),
                JSON.stringify(Array.isArray(sourceRows) ? sourceRows : []),
                notas || null,
                req.user.id,
            ]
        );
        const version = versionResult.rows[0];

        const values = [];
        const placeholders = [];
        let idx = 1;
        for (const tarifa of validTarifas) {
            placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10}, $${idx + 11})`);
            values.push(
                version.id,
                proveedor.id,
                tarifa.referencia,
                tarifa.serie || null,
                tarifa.clave_descripcion || null,
                tarifa.articulo,
                tarifa.familia || null,
                tarifa.ancho || null,
                tarifa.alto || null,
                tarifa.precio || null,
                tarifa.descripcion || null,
                importeYear
            );
            idx += 12;
        }

        await client.query(
            `INSERT INTO tarifas (version_id, proveedor_id, referencia, serie, clave_descripcion, articulo, familia, ancho, alto, precio, descripcion, importe_year)
             VALUES ${placeholders.join(', ')}`,
            values
        );

        await client.query('COMMIT');
        res.status(201).json({
            proveedor,
            version: {
                ...version,
                total_tarifas: validTarifas.length,
            },
            inserted: validTarifas.length,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            return res.status(400).json({ error: 'El proveedor ya existe o la version esta duplicada' });
        }
        console.error('Error al importar tarifas:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.post('/versiones/:id/activate', authenticate, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const current = await client.query(
            'SELECT * FROM tarifa_versiones WHERE id = $1',
            [id]
        );
        if (!current.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Version no encontrada' });
        }

        const version = current.rows[0];
        await client.query(
            'UPDATE tarifa_versiones SET is_active = false, updated_at = NOW() WHERE proveedor_id = $1 AND importe_year = $2',
            [version.proveedor_id, version.importe_year]
        );
        const activated = await client.query(
            'UPDATE tarifa_versiones SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        await client.query('COMMIT');
        res.json(activated.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al activar version:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.delete('/versiones/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const current = await client.query(
            'SELECT * FROM tarifa_versiones WHERE id = $1',
            [id]
        );
        if (!current.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Version no encontrada' });
        }

        const version = current.rows[0];
        await client.query('DELETE FROM tarifa_versiones WHERE id = $1', [id]);

        if (version.is_active) {
            const replacement = await client.query(
                `SELECT id FROM tarifa_versiones
                 WHERE proveedor_id = $1 AND importe_year = $2
                 ORDER BY revision DESC
                 LIMIT 1`,
                [version.proveedor_id, version.importe_year]
            );
            if (replacement.rows.length) {
                await client.query(
                    'UPDATE tarifa_versiones SET is_active = true, updated_at = NOW() WHERE id = $1',
                    [replacement.rows[0].id]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ deleted: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar version:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.get('/', authenticate, async (req, res) => {
    const versionId = req.query.version_id || null;
    const proveedorId = req.query.proveedor_id || null;
    const year = parseOptionalInt(req.query.year);
    const { familia, search } = req.query;
    const limit = Math.min(parseOptionalInt(req.query.limit) || 1000, 5000);
    const offset = parseOptionalInt(req.query.offset) || 0;

    const params = [];
    const clauses = applyTarifaFilters({ versionId, proveedorId, year, familia, search }, params);
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    params.push(limit);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    try {
        const result = await pool.query(`
            SELECT
                t.id,
                t.version_id,
                t.referencia,
                t.serie,
                t.clave_descripcion,
                t.articulo,
                t.familia,
                t.ancho,
                t.alto,
                t.precio,
                t.descripcion,
                t.importe_year,
                t.created_at,
                p.nombre AS proveedor_nombre,
                tv.revision,
                tv.is_active
            FROM tarifas t
            INNER JOIN proveedores p ON p.id = t.proveedor_id
            LEFT JOIN tarifa_versiones tv ON tv.id = t.version_id
            ${whereSql}
            ORDER BY t.referencia ASC
            LIMIT $${limitParam}
            OFFSET $${offsetParam}
        `, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener tarifas:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/familias', authenticate, async (req, res) => {
    const versionId = req.query.version_id || null;
    const proveedorId = req.query.proveedor_id || null;
    const year = parseOptionalInt(req.query.year);
    const params = [];
    const clauses = applyTarifaFilters({ versionId, proveedorId, year, familia: null, search: null }, params);
    clauses.push('t.familia IS NOT NULL');
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    try {
        const result = await pool.query(`
            SELECT DISTINCT t.familia
            FROM tarifas t
            ${whereSql}
            ORDER BY t.familia ASC
        `, params);
        res.json(result.rows.map((row) => row.familia));
    } catch (err) {
        console.error('Error al obtener familias:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/anos', authenticate, async (req, res) => {
    const { proveedor_id: proveedorId } = req.query;
    const params = [];
    const whereSql = proveedorId ? 'WHERE proveedor_id = $1' : '';
    if (proveedorId) params.push(proveedorId);

    try {
        const result = await pool.query(`
            SELECT DISTINCT importe_year
            FROM tarifa_versiones
            ${whereSql}
            ORDER BY importe_year DESC
        `, params);
        res.json(result.rows.map((row) => row.importe_year));
    } catch (err) {
        console.error('Error al obtener anos:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
