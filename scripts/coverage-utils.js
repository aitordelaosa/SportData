const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportDir = path.join(rootDir, 'coverage-report');
const servicesDir = path.join(reportDir, 'services');
const productsVenvPython = process.platform === 'win32'
  ? path.join(rootDir, 'microservicioProductos', '.venv', 'Scripts', 'python.exe')
  : path.join(rootDir, 'microservicioProductos', '.venv', 'bin', 'python');

function resolvePythonCommand() {
  if (process.env.PYTHON) return process.env.PYTHON;
  if (fs.existsSync(productsVenvPython)) return productsVenvPython;
  return 'python';
}

const services = [
  {
    key: 'api-gateway',
    label: 'api-gateway',
    type: 'node',
    cwd: path.join(rootDir, 'api-gateway'),
    command: ['npm', ['run', 'test:coverage']],
    summaryPath: path.join(rootDir, 'api-gateway', 'coverage', 'coverage-summary.json'),
    htmlPath: path.join(rootDir, 'api-gateway', 'coverage', 'lcov-report'),
    target: 60,
    tests: [
      'GET /health',
      'GET /api',
      '404 de rutas inexistentes',
      'Proxy de productos con servicio mockeado',
      'Autenticacion y autorizacion admin',
      'Propagacion de errores remotos',
    ],
  },
  {
    key: 'microservicioUsuarios',
    label: 'microservicioUsuarios',
    type: 'node',
    cwd: path.join(rootDir, 'microservicioUsuarios'),
    command: ['npm', ['run', 'test:coverage']],
    summaryPath: path.join(rootDir, 'microservicioUsuarios', 'coverage', 'coverage-summary.json'),
    htmlPath: path.join(rootDir, 'microservicioUsuarios', 'coverage', 'lcov-report'),
    target: 60,
    tests: [
      'GET /health',
      'Registro valido',
      'Registro invalido',
      'Login correcto',
      'Login incorrecto',
      'Perfil sin token',
      'Perfil con token',
    ],
  },
  {
    key: 'microservicioProductos',
    label: 'microservicioProductos',
    type: 'python',
    cwd: path.join(rootDir, 'microservicioProductos'),
    commands: [
      [resolvePythonCommand(), ['-m', 'coverage', 'run', '--branch', '--source=app', '-m', 'pytest']],
      [resolvePythonCommand(), ['-m', 'coverage', 'report']],
      [resolvePythonCommand(), ['-m', 'coverage', 'html', '-d', 'htmlcov']],
      [resolvePythonCommand(), ['-m', 'coverage', 'json', '-o', 'coverage.json']],
      [resolvePythonCommand(), ['-m', 'coverage', 'xml', '-o', 'coverage.xml']],
    ],
    summaryPath: path.join(rootDir, 'microservicioProductos', 'coverage.json'),
    htmlPath: path.join(rootDir, 'microservicioProductos', 'htmlcov'),
    target: 60,
    tests: [
      'GET /',
      'GET /products con filtros',
      'GET /products/{id}',
      '404 de producto inexistente',
      'POST /products',
      'PUT /products/{id}',
      'PATCH /products/{id}/stock',
      'DELETE /products/{id}',
    ],
  },
  {
    key: 'microservicioPedidos',
    label: 'microservicioPedidos',
    type: 'node',
    cwd: path.join(rootDir, 'microservicioPedidos'),
    command: ['npm', ['run', 'test:coverage']],
    summaryPath: path.join(rootDir, 'microservicioPedidos', 'coverage', 'coverage-summary.json'),
    htmlPath: path.join(rootDir, 'microservicioPedidos', 'coverage', 'lcov-report'),
    target: 50,
    tests: [
      'GET /health',
      'Carrito vacio',
      'Carrito sin autenticacion',
      'Alta, actualizacion y borrado de item',
      'Favoritos',
      'Checkout con carrito vacio',
      'Checkout correcto',
      'Estadisticas admin',
    ],
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(source, destination) {
  if (!fs.existsSync(source)) return false;
  try {
    removeDir(destination);
  } catch (error) {
    console.warn(`No se pudo limpiar ${destination}: ${error.message}`);
  }
  ensureDir(destination);
  fs.cpSync(source, destination, {
    recursive: true,
    force: true,
    filter: (sourcePath) => path.basename(sourcePath) !== '.gitignore',
  });
  return true;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function pct(covered, total) {
  if (!total) return null;
  return Number(((covered / total) * 100).toFixed(2));
}

function normalizeMetric(metric) {
  if (!metric) {
    return { covered: 0, total: 0, pct: null };
  }
  const covered = Number(metric.covered || 0);
  const total = Number(metric.total || 0);
  const value = metric.pct === 'Unknown' || metric.pct === undefined
    ? pct(covered, total)
    : Number(metric.pct);
  return {
    covered,
    total,
    pct: Number.isFinite(value) ? Number(value.toFixed(2)) : null,
  };
}

function relativeFile(service, filePath) {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(service.cwd, filePath);
  return path.relative(service.cwd, absolute).replace(/\\/g, '/');
}

function parseNodeCoverage(service) {
  const summary = readJson(service.summaryPath);
  const total = summary.total || {};
  const metrics = {
    statements: normalizeMetric(total.statements),
    branches: normalizeMetric(total.branches),
    functions: normalizeMetric(total.functions),
    lines: normalizeMetric(total.lines),
  };

  const files = Object.entries(summary)
    .filter(([file]) => file !== 'total')
    .map(([file, data]) => ({
      service: service.key,
      path: relativeFile(service, file),
      statements: normalizeMetric(data.statements),
      branches: normalizeMetric(data.branches),
      functions: normalizeMetric(data.functions),
      lines: normalizeMetric(data.lines),
    }))
    .sort((a, b) => (a.lines.pct ?? 101) - (b.lines.pct ?? 101));

  return { metrics, files };
}

function parsePythonCoverage(service) {
  const coverage = readJson(service.summaryPath);
  const totals = coverage.totals || {};
  const coveredLines = Number(totals.covered_lines || 0);
  const numStatements = Number(totals.num_statements || 0);
  const coveredBranches = Number(totals.covered_branches || 0);
  const numBranches = Number(totals.num_branches || 0);
  const linePct = Number(totals.percent_covered_display || totals.percent_covered || pct(coveredLines, numStatements) || 0);

  const metrics = {
    statements: { covered: coveredLines, total: numStatements, pct: pct(coveredLines, numStatements) },
    branches: { covered: coveredBranches, total: numBranches, pct: pct(coveredBranches, numBranches) },
    functions: { covered: 0, total: 0, pct: null },
    lines: { covered: coveredLines, total: numStatements, pct: Number(linePct.toFixed(2)) },
  };

  const files = Object.entries(coverage.files || {})
    .map(([file, data]) => {
      const summary = data.summary || {};
      const fileCoveredLines = Number(summary.covered_lines || 0);
      const fileStatements = Number(summary.num_statements || 0);
      const fileCoveredBranches = Number(summary.covered_branches || 0);
      const fileBranches = Number(summary.num_branches || 0);
      const filePct = Number(summary.percent_covered_display || summary.percent_covered || pct(fileCoveredLines, fileStatements) || 0);
      return {
        service: service.key,
        path: relativeFile(service, file),
        statements: {
          covered: fileCoveredLines,
          total: fileStatements,
          pct: pct(fileCoveredLines, fileStatements),
        },
        branches: {
          covered: fileCoveredBranches,
          total: fileBranches,
          pct: pct(fileCoveredBranches, fileBranches),
        },
        functions: { covered: 0, total: 0, pct: null },
        lines: {
          covered: fileCoveredLines,
          total: fileStatements,
          pct: Number(filePct.toFixed(2)),
        },
      };
    })
    .sort((a, b) => (a.lines.pct ?? 101) - (b.lines.pct ?? 101));

  return { metrics, files };
}

function emptyMetrics() {
  return {
    statements: { covered: 0, total: 0, pct: null },
    branches: { covered: 0, total: 0, pct: null },
    functions: { covered: 0, total: 0, pct: null },
    lines: { covered: 0, total: 0, pct: null },
  };
}

function parseCoverage(service, statusByService = {}) {
  const copied = copyDir(service.htmlPath, path.join(servicesDir, service.key));
  const status = statusByService[service.key] || {};

  if (!fs.existsSync(service.summaryPath)) {
    return {
      key: service.key,
      label: service.label,
      type: service.type,
      target: service.target,
      status: status.ok ? 'missing-report' : 'failed',
      exitCode: status.exitCode ?? null,
      htmlReport: copied ? `services/${service.key}/index.html` : null,
      metrics: emptyMetrics(),
      files: [],
      tests: service.tests,
      notes: ['No se encontro el resumen de cobertura del servicio.'],
    };
  }

  const parsed = service.type === 'python'
    ? parsePythonCoverage(service)
    : parseNodeCoverage(service);

  const notes = [];
  if (service.type === 'python') {
    notes.push('coverage.py no expone cobertura de funciones; el valor aparece como N/A.');
  }

  return {
    key: service.key,
    label: service.label,
    type: service.type,
    target: service.target,
    status: status.ok === false ? 'failed' : 'ok',
    exitCode: status.exitCode ?? 0,
    htmlReport: copied ? `services/${service.key}/index.html` : null,
    metrics: parsed.metrics,
    files: parsed.files,
    tests: service.tests,
    notes,
  };
}

function aggregateMetrics(serviceSummaries) {
  const metricNames = ['statements', 'branches', 'functions', 'lines'];
  return metricNames.reduce((acc, name) => {
    const covered = serviceSummaries.reduce(
      (sum, service) => sum + (service.metrics[name]?.covered || 0),
      0,
    );
    const total = serviceSummaries.reduce(
      (sum, service) => sum + (service.metrics[name]?.total || 0),
      0,
    );
    acc[name] = { covered, total, pct: pct(covered, total) };
    return acc;
  }, {});
}

function buildRecommendations(serviceSummaries, lowestFiles) {
  const recommendations = [];
  for (const service of serviceSummaries) {
    if (service.status !== 'ok') {
      recommendations.push(`${service.label}: revisar la ejecucion de tests antes de interpretar la cobertura.`);
      continue;
    }
    const linePct = service.metrics.lines.pct;
    if (linePct !== null && linePct < service.target) {
      recommendations.push(`${service.label}: ampliar tests de rutas y ramas de error para superar el objetivo del ${service.target}%.`);
    }
    const branchPct = service.metrics.branches.pct;
    if (branchPct !== null && branchPct < 50) {
      recommendations.push(`${service.label}: cubrir validaciones, permisos y respuestas 4xx/5xx para mejorar branches.`);
    }
  }

  for (const file of lowestFiles.slice(0, 3)) {
    recommendations.push(`Priorizar ${file.service}/${file.path}, actualmente en ${formatPct(file.lines.pct)} de lineas.`);
  }

  if (!recommendations.length) {
    recommendations.push('Mantener la suite como control de regresion y ampliar casos de borde al cambiar reglas de negocio.');
  }
  return recommendations;
}

function buildSummary(statusByService = {}) {
  ensureDir(servicesDir);
  const serviceSummaries = services.map((service) => parseCoverage(service, statusByService));
  const lowestFiles = serviceSummaries
    .flatMap((service) => service.files)
    .filter((file) => file.lines.total > 0)
    .sort((a, b) => (a.lines.pct ?? 101) - (b.lines.pct ?? 101))
    .slice(0, 12);
  const global = aggregateMetrics(serviceSummaries);
  const summary = {
    generatedAt: new Date().toISOString(),
    dashboard: 'coverage-report/index.html',
    global,
    services: serviceSummaries,
    lowestFiles,
    recommendations: buildRecommendations(serviceSummaries, lowestFiles),
  };

  ensureDir(reportDir);
  fs.writeFileSync(path.join(reportDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir, 'index.html'), renderDashboard(summary));
  return summary;
}

function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }
  return `${Number(value).toFixed(2)}%`;
}

function metricClass(value) {
  if (value === null || value === undefined) return 'unknown';
  if (value >= 80) return 'high';
  if (value >= 60) return 'medium';
  return 'low';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bar(metric) {
  const value = metric?.pct;
  const width = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
  return `
    <div class="bar" aria-label="${formatPct(value)}">
      <span class="${metricClass(value)}" style="width: ${width}%"></span>
    </div>
  `;
}

function renderMetricCell(metric) {
  return `<td><strong>${formatPct(metric?.pct)}</strong>${bar(metric)}</td>`;
}

function renderDashboard(summary) {
  const generated = new Date(summary.generatedAt).toLocaleString('es-ES');
  const serviceCards = summary.services.map((service) => `
    <article class="card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(service.label)}</h3>
          <p>${escapeHtml(service.type)} · objetivo ${service.target}%</p>
        </div>
        <span class="status ${service.status === 'ok' ? 'ok' : 'fail'}">${escapeHtml(service.status)}</span>
      </div>
      <div class="big-number">${formatPct(service.metrics.lines.pct)}</div>
      ${bar(service.metrics.lines)}
      <dl class="mini-grid">
        <div><dt>Statements</dt><dd>${formatPct(service.metrics.statements.pct)}</dd></div>
        <div><dt>Branches</dt><dd>${formatPct(service.metrics.branches.pct)}</dd></div>
        <div><dt>Functions</dt><dd>${formatPct(service.metrics.functions.pct)}</dd></div>
      </dl>
      ${service.htmlReport ? `<a class="report-link" href="${escapeHtml(service.htmlReport)}">Abrir informe HTML individual</a>` : '<span class="muted">Informe individual no disponible</span>'}
    </article>
  `).join('');

  const rows = summary.services.map((service) => `
    <tr>
      <th scope="row">${escapeHtml(service.label)}</th>
      ${renderMetricCell(service.metrics.statements)}
      ${renderMetricCell(service.metrics.branches)}
      ${renderMetricCell(service.metrics.functions)}
      ${renderMetricCell(service.metrics.lines)}
    </tr>
  `).join('');

  const tests = summary.services.map((service) => `
    <section class="test-block">
      <h3>${escapeHtml(service.label)}</h3>
      <ul>${service.tests.map((test) => `<li>${escapeHtml(test)}</li>`).join('')}</ul>
    </section>
  `).join('');

  const lowFiles = summary.lowestFiles.map((file) => `
    <tr>
      <td>${escapeHtml(file.service)}</td>
      <td>${escapeHtml(file.path)}</td>
      ${renderMetricCell(file.lines)}
      ${renderMetricCell(file.branches)}
    </tr>
  `).join('');

  const recommendations = summary.recommendations
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cobertura de tests - SportData</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --ink: #17202a;
      --muted: #607085;
      --line: #d8dee8;
      --blue: #246bfe;
      --green: #18885c;
      --amber: #b7791f;
      --red: #c24135;
      --shadow: 0 14px 30px rgba(25, 34, 46, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--ink);
    }
    header {
      background: #101828;
      color: #fff;
      padding: 32px 24px;
    }
    .wrap { max-width: 1180px; margin: 0 auto; }
    h1, h2, h3 { margin: 0; line-height: 1.15; }
    h1 { font-size: 32px; }
    h2 { font-size: 22px; margin-bottom: 16px; }
    h3 { font-size: 16px; }
    p { color: var(--muted); margin: 6px 0 0; }
    header p { color: #cbd5e1; }
    main { padding: 28px 24px 40px; }
    .hero {
      display: grid;
      grid-template-columns: minmax(220px, 320px) 1fr;
      gap: 20px;
      align-items: stretch;
      margin-bottom: 26px;
    }
    .global {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 22px;
    }
    .global-number {
      font-size: 56px;
      font-weight: 800;
      letter-spacing: 0;
      margin: 8px 0 10px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 18px;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }
    .status {
      border-radius: 999px;
      padding: 4px 9px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status.ok { background: #e7f7ef; color: var(--green); }
    .status.fail { background: #fdebea; color: var(--red); }
    .big-number {
      font-size: 34px;
      font-weight: 800;
      margin: 14px 0 8px;
    }
    .bar {
      width: 100%;
      height: 9px;
      background: #e8edf4;
      border-radius: 999px;
      overflow: hidden;
      margin-top: 7px;
    }
    .bar span {
      display: block;
      height: 100%;
      border-radius: inherit;
    }
    .bar .high { background: var(--green); }
    .bar .medium { background: var(--amber); }
    .bar .low { background: var(--red); }
    .bar .unknown { background: #9aa7b7; }
    .mini-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 16px 0;
    }
    dt { color: var(--muted); font-size: 12px; }
    dd { margin: 3px 0 0; font-weight: 700; }
    .report-link {
      color: var(--blue);
      font-weight: 700;
      text-decoration: none;
    }
    .report-link:hover { text-decoration: underline; }
    section { margin-top: 26px; }
    .panel {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      padding: 13px 14px;
      text-align: left;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      font-size: 14px;
    }
    thead th {
      background: #eef2f7;
      color: #3b4858;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    tbody tr:last-child th,
    tbody tr:last-child td { border-bottom: 0; }
    td strong { display: inline-block; min-width: 64px; }
    .tests-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(260px, 1fr));
      gap: 16px;
    }
    .test-block {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
      margin: 0;
    }
    ul { margin: 12px 0 0; padding-left: 20px; color: #324155; }
    li + li { margin-top: 7px; }
    .muted { color: var(--muted); }
    .footer-note {
      color: var(--muted);
      font-size: 13px;
      margin-top: 24px;
    }
    @media (max-width: 860px) {
      .hero, .cards, .tests-grid { grid-template-columns: 1fr; }
      h1 { font-size: 26px; }
      .global-number { font-size: 44px; }
      th, td { padding: 11px 10px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <h1>Cobertura de tests - SportData</h1>
      <p>Generado el ${escapeHtml(generated)}. Dashboard local sin dependencias externas.</p>
    </div>
  </header>
  <main class="wrap">
    <section class="hero" aria-labelledby="global-title">
      <div class="global">
        <h2 id="global-title">Resumen global</h2>
        <div class="global-number">${formatPct(summary.global.lines.pct)}</div>
        ${bar(summary.global.lines)}
        <p>Calculado por lineas cubiertas sobre lineas instrumentadas en backend.</p>
      </div>
      <div class="cards">${serviceCards}</div>
    </section>

    <section aria-labelledby="services-title">
      <h2 id="services-title">Cobertura por microservicio</h2>
      <div class="panel">
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Statements</th>
              <th>Branches</th>
              <th>Functions</th>
              <th>Lines</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr>
              <th scope="row">GLOBAL</th>
              ${renderMetricCell(summary.global.statements)}
              ${renderMetricCell(summary.global.branches)}
              ${renderMetricCell(summary.global.functions)}
              ${renderMetricCell(summary.global.lines)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="tests-title">
      <h2 id="tests-title">Tests ejecutados</h2>
      <div class="tests-grid">${tests}</div>
    </section>

    <section aria-labelledby="low-title">
      <h2 id="low-title">Archivos con menor cobertura</h2>
      <div class="panel">
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Archivo</th>
              <th>Lines</th>
              <th>Branches</th>
            </tr>
          </thead>
          <tbody>${lowFiles || '<tr><td colspan="4">No hay datos de archivos.</td></tr>'}</tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="recommendations-title">
      <h2 id="recommendations-title">Recomendaciones de mejora</h2>
      <div class="panel" style="padding: 18px;">
        <ul>${recommendations}</ul>
      </div>
    </section>
    <p class="footer-note">Los informes individuales se copian en coverage-report/services y el resumen tecnico queda en coverage-report/summary.json.</p>
  </main>
</body>
</html>
`;
}

function formatTerminalTable(summary) {
  const headers = ['Servicio', 'Statements', 'Branches', 'Functions', 'Lines'];
  const serviceRows = summary.services.map((service) => [
    service.label,
    formatPct(service.metrics.statements.pct),
    formatPct(service.metrics.branches.pct),
    formatPct(service.metrics.functions.pct),
    formatPct(service.metrics.lines.pct),
  ]);
  const rows = [
    headers,
    ...serviceRows,
    [
      'GLOBAL',
      formatPct(summary.global.statements.pct),
      formatPct(summary.global.branches.pct),
      formatPct(summary.global.functions.pct),
      formatPct(summary.global.lines.pct),
    ],
  ];
  const widths = headers.map((_, index) =>
    Math.max(...rows.map((row) => String(row[index]).length)),
  );
  return rows
    .map((row, rowIndex) => {
      const line = row.map((cell, index) => String(cell).padEnd(widths[index])).join('   ');
      if (rowIndex === 0) {
        const separator = widths.map((width) => '-'.repeat(width)).join('   ');
        return `${line}\n${separator}`;
      }
      return line;
    })
    .join('\n');
}

module.exports = {
  rootDir,
  reportDir,
  servicesDir,
  services,
  ensureDir,
  removeDir,
  buildSummary,
  formatTerminalTable,
  formatPct,
};
