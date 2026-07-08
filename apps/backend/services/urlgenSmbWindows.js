const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

const SMB_TIMEOUT_MS = Math.max(parseInt(process.env.URLGEN_SMB_TIMEOUT_MS || '30000', 10), 5000);

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

function getPlatform() {
    return os.platform();
}

function normalizeRelativePath(relativePath) {
    return String(relativePath || '')
        .replace(/\//g, '\\')
        .replace(/^\\+/, '')
        .replace(/\\+$/, '');
}

function buildSmbPath() {
    const host = getRequiredEnv('URLGEN_SMB_HOST');
    const share = getRequiredEnv('URLGEN_SMB_SHARE');
    return `\\\\${host}\\${share}`;
}

function buildNetUseCommand(smbPath, username, password, domain) {
    const passwordArg = password.replace(/'/g, "''");
    if (domain) {
        return `net use ${smbPath} '${passwordArg}' /USER:${domain}\\${username}`;
    }
    return `net use ${smbPath} '${passwordArg}' /USER:${username}`;
}

function isAlreadyExistsError(output) {
    const combined = `${output || ''}`;
    return combined.includes('already exists') || combined.includes('ya existe') || combined.includes('ERROR_FILE_EXISTS');
}

function isAccessDeniedError(output) {
    const combined = `${output || ''}`;
    return combined.includes('Access is denied') || combined.includes('Acceso denegado') || combined.includes('ERROR_ACCESS_DENIED');
}

function ensureConnected(smbPath) {
    const username = getRequiredEnv('URLGEN_SMB_USER');
    const password = getRequiredEnv('URLGEN_SMB_PASSWORD');
    const domain = process.env.URLGEN_SMB_DOMAIN || '';

    const cmd = buildNetUseCommand(smbPath, username, password, domain);

    try {
        execSync(cmd, { timeout: SMB_TIMEOUT_MS, stdio: 'pipe', windowsHide: true });
    } catch (error) {
        const output = error.stdout?.toString() || '' + error.stderr?.toString() || '';
        if (!output.includes('The command completed successfully') && !output.includes('comando se completó')) {
            if (!isAlreadyExistsError(output)) {
                throw new Error(`Error conectando a SMB: ${output || error.message}`);
            }
        }
    }
}

function mkdirRelative(relativePath) {
    const safePath = normalizeRelativePath(relativePath);
    const smbPath = buildSmbPath();
    const fullPath = `${smbPath}\\${safePath}`;

    const psCommand = `New-Item -Path '${fullPath.replace(/'/g, "''")}' -ItemType Directory -Force`;

    try {
        ensureConnected(smbPath);
        execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand.replace(/"/g, '\\"')}"`, {
            timeout: SMB_TIMEOUT_MS,
            windowsHide: true,
            stdio: 'pipe'
        });
        return { created: true, alreadyExists: false, path: safePath };
    } catch (error) {
        const output = error.stdout?.toString() || '' + error.stderr?.toString() || '';
        if (isAlreadyExistsError(output) || output.includes('already exists')) {
            return { created: false, alreadyExists: true, path: safePath };
        }
        if (isAccessDeniedError(output)) {
            throw new Error(`Acceso denegado creando "${safePath}". Verifica permisos SMB.`);
        }
        throw new Error(`Error creando carpeta "${safePath}": ${output || error.message}`);
    }
}

function createFolderTree(folderName, subfolders = []) {
    const createdPaths = [];
    const existingPaths = [];
    const root = mkdirRelative(folderName);

    if (root.created) createdPaths.push(root.path);
    if (root.alreadyExists) existingPaths.push(root.path);

    for (const subfolder of subfolders) {
        const relativePath = `${folderName}\\${subfolder}`;
        const result = mkdirRelative(relativePath);
        if (result.created) createdPaths.push(result.path);
        if (result.alreadyExists) existingPaths.push(result.path);
    }

    return { createdPaths, existingPaths };
}

function disconnectShare(smbPath) {
    try {
        execSync(`net use ${smbPath} /DELETE`, { timeout: 5000, windowsHide: true, stdio: 'pipe' });
    } catch {
        // no-op - puede fallar si ya estaba desconectada
    }
}

module.exports = {
    assertSmbConfig,
    createFolderTree,
    getPlatform,
    disconnectShare,
};
