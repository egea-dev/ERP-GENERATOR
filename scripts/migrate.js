const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/backend/.env') });

const runSqlFile = async (client, filePath) => {
    console.log(`Ejecutando: ${path.basename(filePath)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`✅ Completado: ${path.basename(filePath)}`);
};

const migrate = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Conectado a PostgreSQL');

        // 1. Esquema Standalone
        await runSqlFile(client, path.join(__dirname, '../database/00_standalone_postgres.sql'));
        
        // 2. Semilla de usuario
        await runSqlFile(client, path.join(__dirname, '../database/seed_user.sql'));

        console.log('\n--- Migración completada con éxito ---');
    } catch (err) {
        console.error('❌ Error en la migración:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
};

migrate();
