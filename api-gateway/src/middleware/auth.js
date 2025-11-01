const jwt = require('jsonwebtoken');
const { app } = require('../config/env');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Token de autenticacion no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, app.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido o expirado' });
  }
}

module.exports = {
  authenticate,
  extractToken,
};
