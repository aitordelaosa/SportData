const mongoose = require('mongoose');
const dotenv = require('dotenv');

const createApp = require('./app');

dotenv.config();

const PORT = parseInt(process.env.PORT || '7000', 10);
const MONGO_URI =
  process.env.ORDERS_MONGO_URI || 'mongodb://orders-db:27017/sportdata_orders';
const app = createApp();

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
