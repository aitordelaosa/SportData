const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const routes = require('./routes');
const errorHandler = require('./utils/errorHandler');

function createApp() {
  const app = express();
  const productServiceUrl =
    process.env.PRODUCT_SERVICE_URL || 'http://product-service:8002';

  app.use(cors());
  app.use(express.json());

  app.use(routes);

  app.get('/health', async (req, res) => {
    const state = mongoose.connection.readyState;
    const statuses = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
      status: 'ok',
      db: statuses[state] || 'unknown',
      productService: productServiceUrl,
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
