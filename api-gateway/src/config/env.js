const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});

const config = {
  app: {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'gateway-dev-secret',
  },
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:4001/api',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8010',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:7000',
  },
};

module.exports = config;
