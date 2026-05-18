const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const { reportDir } = require('./coverage-utils');

const indexPath = path.join(reportDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('No existe coverage-report/index.html. Ejecuta primero npm run test:coverage.');
  process.exit(1);
}

let command;
let args;

if (process.platform === 'win32') {
  command = 'cmd';
  args = ['/c', 'start', '', indexPath];
} else if (process.platform === 'darwin') {
  command = 'open';
  args = [indexPath];
} else {
  command = 'xdg-open';
  args = [indexPath];
}

const child = spawn(command, args, {
  detached: true,
  stdio: 'ignore',
});

child.unref();
