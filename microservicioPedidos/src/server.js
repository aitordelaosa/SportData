const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const routes = require('./routes');
const errorHandler = require('./utils/errorHandler');

dotenv.config();

const app = express();

const PORT = parseInt(process.env.PORT || '7000', 10);
const MONGO_URI =
  process.env.ORDERS_MONGO_URI || 'mongodb://orders-db:27017/sportdata_orders';
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://product-service:8002';
const JWT_SECRET = process.env.JWT_SECRET || 'sportdata-dev-secret';

app.use(cors());
app.use(express.json());

app.use(routes);

app.get('/health', async (req, res) => {
  const state = mongoose.connection.readyState;
  const statuses = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    db: statuses[state] || 'unknown',
    productService: PRODUCT_SERVICE_URL,
  });
});

app.use(errorHandler);

async function bootstrap() {
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`[orders-service] listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[orders-service] failed to start', error);
  process.exit(1);
});
