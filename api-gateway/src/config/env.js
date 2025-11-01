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
  },
};

module.exports = config;
