const jwt = require('jsonwebtoken');
const { app } = require('../config/env');

function generateToken(payload, options = {}) {
  return jwt.sign(payload, app.jwtSecret, {
    expiresIn: app.jwtExpiresIn,
    ...options,
  });
}

function verifyToken(token) {
  return jwt.verify(token, app.jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken,
};
