const fs = require('fs');
const path = require('path');

const {
  reportDir,
  formatTerminalTable,
} = require('./coverage-utils');

const summaryPath = path.join(reportDir, 'summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('No existe coverage-report/summary.json. Ejecuta primero npm run test:coverage.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
console.log('Cobertura consolidada');
console.log(formatTerminalTable(summary));
console.log(`\nDashboard HTML: ${summary.dashboard}`);
