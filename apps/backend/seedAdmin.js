const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function seedAdminUser() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        const result = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@egeadev.cloud']);

        if (result.rows.length === 0) {
            const passwordHash = await bcrypt.hash('Admin123!', 10);

            const userRes = await pool.query(
                'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id',
                ['admin@egeadev.cloud', passwordHash, 'Administrador']
            );

            const userId = userRes.rows[0].id;

            await pool.query(
                'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
                [userId, 'admin']
            );

            console.log('[SEED] Admin user created: admin@egeadev.cloud');
        } else {
            console.log('[SEED] Admin user already exists');
        }
    } catch (err) {
        console.error('[SEED] Error creating admin user:', err.message);
    } finally {
        await pool.end();
    }
}

module.exports = seedAdminUser;
