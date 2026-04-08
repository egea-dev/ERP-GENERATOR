const { execFile } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const SMB_PROTOCOL = process.env.URLGEN_SMB_PROTOCOL || 'SMB3';
const SMB_TIMEOUT_MS = Math.max(parseInt(process.env.URLGEN_SMB_TIMEOUT_MS || '15000', 10), 1000);

let authFilePathPromise;

function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Falta la variable de entorno ${name}`);
    }
    return value;
}

function assertSmbConfig() {
    getRequiredEnv('URLGEN_SMB_HOST');
    getRequiredEnv('URLGEN_SMB_SHARE');
    getRequiredEnv('URLGEN_SMB_USER');
    getRequiredEnv('URLGEN_SMB_PASSWORD');
}

async function ensureAuthFile() {
    if (!authFilePathPromise) {
        authFilePathPromise = (async () => {
            const username = getRequiredEnv('URLGEN_SMB_USER');
            const password = getRequiredEnv('URLGEN_SMB_PASSWORD');
            const domain = process.env.URLGEN_SMB_DOMAIN || '';
            const authFilePath = path.join(os.tmpdir(), `urlgen-smb-${process.pid}.auth`);
            const authLines = [
                `username = ${username}`,
                `password = ${password}`,
            ];

            if (domain) {
                authLines.push(`domain = ${domain}`);
            }

            await fs.writeFile(authFilePath, `${authLines.join('\n')}\n`, { mode: 0o600 });
            return authFilePath;
        })();
    }

    return authFilePathPromise;
}

function buildSmbTarget() {
    const host = getRequiredEnv('URLGEN_SMB_HOST');
    const share = getRequiredEnv('URLGEN_SMB_SHARE');
    return `//${host}/${share}`;
}

function normalizeRelativePath(relativePath) {
    return String(relativePath || '')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');
}

function quoteSmbPath(relativePath) {
    return normalizeRelativePath(relativePath).replace(/"/g, '');
}

async function runSmbCommand(command) {
    const target = buildSmbTarget();
    const authFilePath = await ensureAuthFile();

    return await new Promise((resolve, reject) => {
        execFile(
            'smbclient',
            [target, '-A', authFilePath, '-m', SMB_PROTOCOL, '-c', command],
            { timeout: SMB_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
            (error, stdout, stderr) => {
                if (error) {
                    error.stdout = stdout;
                    error.stderr = stderr;
                    reject(error);
                    return;
                }
                resolve({ stdout, stderr });
            }
        );
    });
}

function isAlreadyExistsError(error) {
    const combined = `${error?.stdout || ''}\n${error?.stderr || ''}\n${error?.message || ''}`;
    return combined.includes('NT_STATUS_OBJECT_NAME_COLLISION') || combined.includes('NT_STATUS_OBJECT_NAME_EXISTS');
}

async function mkdirRelative(relativePath) {
    const safePath = quoteSmbPath(relativePath);

    try {
        await runSmbCommand(`mkdir "${safePath}"`);
        return { created: true, alreadyExists: false, path: safePath };
    } catch (error) {
        if (isAlreadyExistsError(error)) {
            return { created: false, alreadyExists: true, path: safePath };
        }
        throw new Error(`Error SMB creando "${safePath}": ${error.stderr || error.message}`);
    }
}

async function createFolderTree(folderName, subfolders = []) {
    const createdPaths = [];
    const existingPaths = [];
    const root = await mkdirRelative(folderName);

    if (root.created) createdPaths.push(root.path);
    if (root.alreadyExists) existingPaths.push(root.path);

    for (const subfolder of subfolders) {
        const relativePath = `${folderName}/${subfolder}`;
        const result = await mkdirRelative(relativePath);
        if (result.created) createdPaths.push(result.path);
        if (result.alreadyExists) existingPaths.push(result.path);
    }

    return { createdPaths, existingPaths };
}

async function cleanupSmbAuthFile() {
    if (!authFilePathPromise) return;

    try {
        const authFilePath = await authFilePathPromise;
        await fs.unlink(authFilePath);
    } catch {
        // no-op
    } finally {
        authFilePathPromise = null;
    }
}

module.exports = {
    assertSmbConfig,
    createFolderTree,
    cleanupSmbAuthFile,
};
