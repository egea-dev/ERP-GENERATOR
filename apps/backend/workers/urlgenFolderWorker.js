require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const os = require('os');
const { Pool } = require('pg');
const { assertSmbConfig, createFolderTree, cleanupSmbAuthFile } = require('../services/urlgenSmb');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const POLL_INTERVAL_MS = Math.max(parseInt(process.env.URLGEN_WORKER_POLL_MS || '5000', 10), 1000);
const STALE_JOB_MS = Math.max(parseInt(process.env.URLGEN_JOB_STALE_MS || '300000', 10), 60000);
const DEFAULT_SUBFOLDERS = (process.env.URLGEN_DEFAULT_SUBFOLDERS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
const WORKER_ID = process.env.URLGEN_WORKER_ID || `urlgen-worker-${os.hostname()}-${process.pid}`;

let intervalId = null;
let isProcessing = false;

function log(message, details = null) {
    const suffix = details ? ` ${JSON.stringify(details)}` : '';
    console.log(`[URLGEN-WORKER] ${message}${suffix}`);
}

async function insertSystemLog(actionType, details = {}) {
    await pool.query(
        'INSERT INTO system_logs (user_id, action_type, module_name, details, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [null, actionType, 'URLGEN', JSON.stringify(details || {})]
    );
}

async function requeueStaleJobs() {
    const staleBefore = new Date(Date.now() - STALE_JOB_MS).toISOString();
    const result = await pool.query(
        `UPDATE urlgen_folder_jobs
         SET status = 'pending',
             started_at = NULL,
             worker_id = NULL,
             requested_at = NOW(),
             last_error = COALESCE(last_error, 'Tarea recuperada tras reinicio o corte del worker privado.')
         WHERE status = 'processing' AND started_at < $1`,
        [staleBefore]
    );

    if (result.rowCount > 0) {
        log('Tareas recuperadas', { recovered: result.rowCount });
    }
}

async function claimNextJob() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const selectResult = await client.query(
            `SELECT id, directorio_id, folder_name, display_path, attempts
             FROM urlgen_folder_jobs
             WHERE status = 'pending'
             ORDER BY requested_at ASC
             FOR UPDATE SKIP LOCKED
             LIMIT 1`
        );

        if (!selectResult.rows.length) {
            await client.query('COMMIT');
            return null;
        }

        const job = selectResult.rows[0];
        const updateResult = await client.query(
            `UPDATE urlgen_folder_jobs
             SET status = 'processing',
                 started_at = NOW(),
                 worker_id = $2
             WHERE id = $1
             RETURNING *`,
            [job.id, WORKER_ID]
        );

        await client.query('COMMIT');
        return updateResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function markJobDone(job, smbResult) {
    await pool.query(
        `UPDATE urlgen_folder_jobs
         SET status = 'done',
             completed_at = NOW(),
             last_error = NULL
         WHERE id = $1`,
        [job.id]
    );

    await insertSystemLog('FOLDER_CREATE_SUCCESS', {
        directorio_id: job.directorio_id,
        folder_name: job.folder_name,
        display_path: job.display_path,
        worker_id: WORKER_ID,
        created_paths: smbResult.createdPaths,
        existing_paths: smbResult.existingPaths,
    });
}

async function markJobError(job, error) {
    await pool.query(
        `UPDATE urlgen_folder_jobs
         SET status = 'error',
             attempts = attempts + 1,
             last_error = $2
         WHERE id = $1`,
        [job.id, error.message]
    );

    await insertSystemLog('FOLDER_CREATE_ERROR', {
        directorio_id: job.directorio_id,
        folder_name: job.folder_name,
        display_path: job.display_path,
        worker_id: WORKER_ID,
        error: error.message,
    });
}

async function processNextJob() {
    if (isProcessing) return;

    isProcessing = true;
    let job = null;

    try {
        await requeueStaleJobs();
        job = await claimNextJob();

        if (!job) {
            return;
        }

        log('Procesando tarea', {
            job_id: job.id,
            directorio_id: job.directorio_id,
            folder_name: job.folder_name,
        });

        const smbResult = await createFolderTree(job.folder_name, DEFAULT_SUBFOLDERS);
        await markJobDone(job, smbResult);

        log('Tarea completada', {
            job_id: job.id,
            created: smbResult.createdPaths,
            existing: smbResult.existingPaths,
        });
    } catch (error) {
        if (job) {
            await markJobError(job, error);
            log('Tarea fallida', { job_id: job.id, error: error.message });
        } else {
            log('Error del worker sin tarea activa', { error: error.message });
        }
    } finally {
        isProcessing = false;
    }
}

async function shutdown(signal) {
    log(`Apagando worker (${signal})`);

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    await cleanupSmbAuthFile();
    await pool.end();
    process.exit(0);
}

async function start() {
    assertSmbConfig();
    log('Worker privado iniciado', {
        worker_id: WORKER_ID,
        poll_ms: POLL_INTERVAL_MS,
        subfolders: DEFAULT_SUBFOLDERS,
    });

    await requeueStaleJobs();
    await processNextJob();
    intervalId = setInterval(processNextJob, POLL_INTERVAL_MS);
}

process.on('SIGINT', () => {
    shutdown('SIGINT').catch((error) => {
        console.error(error);
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    shutdown('SIGTERM').catch((error) => {
        console.error(error);
        process.exit(1);
    });
});

start().catch(async (error) => {
    console.error('[URLGEN-WORKER] Error fatal:', error.message);
    await cleanupSmbAuthFile();
    await pool.end();
    process.exit(1);
});
