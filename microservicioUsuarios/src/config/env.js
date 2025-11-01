const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});

const config = {
  app: {
    port: parseInt(process.env.PORT || '4001', 10),
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'sportdata-dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27018/sportdata_usuarios',
  },
};

module.exports = config;
