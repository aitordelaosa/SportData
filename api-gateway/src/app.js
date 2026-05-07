const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { buildOpenApiSpec, renderSwaggerHtml } = require('./docs/openapi');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  const jsonBodyLimit = process.env.API_JSON_LIMIT || '2gb';
  const formBodyLimit = process.env.API_FORM_LIMIT || '2gb';

  app.use(cors());
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: formBodyLimit }));
  app.use(morgan('dev'));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/openapi.json', (req, res) => {
    res.json(buildOpenApiSpec(req));
  });

  app.get(['/docs', '/api/docs'], (req, res) => {
    res.type('html').send(renderSwaggerHtml('/openapi.json'));
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
