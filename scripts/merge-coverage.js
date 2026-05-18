const {
  buildSummary,
  formatTerminalTable,
} = require('./coverage-utils');

function main() {
  const summary = buildSummary();
  console.log('Cobertura consolidada');
  console.log(formatTerminalTable(summary));
  console.log(`\nDashboard HTML: ${summary.dashboard}`);
}

main();
