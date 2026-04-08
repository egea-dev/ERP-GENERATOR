require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret';
console.log('>>> [AUTH] JWT_SECRET:', JWT_SECRET);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

console.log('>>> [AUTH] JWT_SECRET:', JWT_SECRET);

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

// Login (public)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Registro (solo admin)
router.post('/register', authenticate, requireAdmin, async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
            [email, password_hash, full_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener usuario actual
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, full_name FROM users WHERE id = $1', [req.user.id]);
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// Obtener rol de usuario
router.get('/role/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT ur.role FROM user_roles ur WHERE ur.user_id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.json({ role: 'user' });
        }
        
        res.json({ role: result.rows[0].role });
    } catch (err) {
        console.error('[AUTH] Error getting role:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Obtener perfiles con roles (solo admin)
router.get('/profiles', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.email, u.full_name, u.created_at, ur.role 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar rol de usuario (solo admin)
router.put('/users/:userId/role', authenticate, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO user_roles (user_id, role) VALUES ($1, $2) 
             ON CONFLICT (user_id) DO UPDATE SET role = $2 RETURNING *`,
            [userId, role]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar usuario (solo admin)
router.delete('/users/:userId', authenticate, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
