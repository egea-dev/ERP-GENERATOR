const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { isProd } = require('./config');

async function seedAdminUser() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_FULL_NAME || 'Administrador';

    if (!email || !password) {
        if (!isProd) {
            console.log('[SEED] ADMIN_EMAIL/ADMIN_PASSWORD no configurados. Se omite seed de administrador.');
        }
        return;
    }

    if (password.length < 12) {
        throw new Error('ADMIN_PASSWORD must have at least 12 characters');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const userResult = await pool.query(
            `INSERT INTO users (email, password_hash, full_name)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
             RETURNING id, email`,
            [email, passwordHash, fullName]
        );

        const user = userResult.rows[0];
        await pool.query(
            `INSERT INTO user_roles (user_id, role)
             VALUES ($1, 'admin')
             ON CONFLICT (user_id) DO UPDATE SET role = 'admin'`,
            [user.id]
        );

        console.log(`[SEED] Admin user ensured: ${user.email}`);
    } catch (err) {
        console.error('[SEED] Error ensuring admin user:', err.message);
        throw err;
    } finally {
        await pool.end();
    }
}

module.exports = seedAdminUser;
