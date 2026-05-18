const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'coverage-report');
const publicDir = path.join(rootDir, 'docs');
const targetDir = path.join(publicDir, 'coverage');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`No se pudo limpiar ${dir}: ${error.message}`);
  }
  ensureDir(dir);
}

function assertCoverageExists() {
  const indexPath = path.join(sourceDir, 'index.html');
  const summaryPath = path.join(sourceDir, 'summary.json');
  if (!fs.existsSync(indexPath) || !fs.existsSync(summaryPath)) {
    console.error('No existe coverage-report completo. Ejecuta primero npm run test:coverage.');
    process.exit(1);
  }
}

function writePagesIndex() {
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=coverage/">
  <title>SportData - Cobertura</title>
</head>
<body>
  <p>Redirigiendo al informe de cobertura de SportData: <a href="coverage/">coverage/</a></p>
</body>
</html>
`;
  fs.writeFileSync(path.join(publicDir, 'index.html'), html);
}

function main() {
  assertCoverageExists();
  cleanDir(targetDir);
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
  fs.writeFileSync(path.join(publicDir, '.nojekyll'), '');
  writePagesIndex();

  console.log('Informe publicable generado en docs/coverage/index.html');
  console.log('Para GitHub Pages: Settings > Pages > Deploy from a branch > main /docs');
  console.log('URL esperada: https://aitordelaosa.github.io/SportData/coverage/');
}

main();
