const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/backend/.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function checkUsers() {
    try {
        await client.connect();
        const res = await client.query('SELECT id, email, full_name FROM users');
        console.log('--- Usuarios en BD ---');
        console.table(res.rows);
        if (res.rows.length === 0) {
            console.warn('⚠️ No hay usuarios en la tabla users.');
        }
    } catch (err) {
        console.error('❌ Error checking users:', err.message);
    } finally {
        await client.end();
    }
}

checkUsers();
