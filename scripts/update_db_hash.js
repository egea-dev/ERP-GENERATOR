const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/backend/.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });
const CORRECT_HASH = '$2b$10$rZSUASs15rgU67g5l9LRD.6uyY.WpKkUUXmg4lYWv0wOjgjObCZta';

async function update() {
    try {
        await client.connect();
        await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [CORRECT_HASH, 'test@example.com']);
        console.log('✅ Base de datos actualizada con el hash verificado');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}
update();
