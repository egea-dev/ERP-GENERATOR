const fs = require('fs');
const path = require('path');

const root = process.cwd();
const viteBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');

if (!fs.existsSync(viteBin)) {
  console.error('\n[ERP] Dependencias no instaladas.');
  console.error('[ERP] Ejecuta primero desde la raiz del repo: npm install');
  console.error('[ERP] Despues vuelve a lanzar: npm run build:frontend\n');
  process.exit(1);
}
