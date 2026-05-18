const { spawnSync } = require('child_process');
const path = require('path');

const {
  reportDir,
  services,
  removeDir,
  ensureDir,
  buildSummary,
  formatTerminalTable,
} = require('./coverage-utils');

function runService(service) {
  const commands = service.commands || [service.command];
  console.log(`\n=== ${service.label} ===`);

  if (service.type === 'python') {
    ensureDir(path.join(service.cwd, '.tmp'));
  }

  const serviceEnv = {
    ...process.env,
    NODE_ENV: 'test',
  };
  if (service.type === 'python') {
    serviceEnv.COVERAGE_FILE = path.join('.tmp', `.coverage-${Date.now()}`);
  }

  for (const [cmd, args] of commands) {
    const pretty = `${cmd} ${args.join(' ')}`;
    console.log(`\n${pretty}`);
    const result = spawnSync(cmd, args, {
      cwd: service.cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50,
      shell: process.platform === 'win32' && cmd === 'npm',
      env: serviceEnv,
    });

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stdout.write(result.stderr);
    }

    if (result.error) {
      console.error(`[${service.label}] ${result.error.message}`);
    }

    if (result.status !== 0) {
      return {
        ok: false,
        exitCode: result.status ?? 1,
      };
    }
  }

  return {
    ok: true,
    exitCode: 0,
  };
}

function main() {
  try {
    removeDir(reportDir);
  } catch (error) {
    console.warn(`No se pudo limpiar coverage-report por bloqueo del sistema: ${error.message}`);
  }
  ensureDir(reportDir);

  const statusByService = {};
  for (const service of services) {
    statusByService[service.key] = runService(service);
  }

  const summary = buildSummary(statusByService);
  console.log('\nCobertura consolidada');
  console.log(formatTerminalTable(summary));
  console.log(`\nDashboard HTML: ${summary.dashboard}`);
  console.log('Resumen JSON: coverage-report/summary.json');

  const failed = Object.values(statusByService).filter((status) => !status.ok);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main();
