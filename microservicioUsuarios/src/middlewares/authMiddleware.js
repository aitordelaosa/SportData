const AppError = require('../utils/appError');
const { verifyToken } = require('../utils/jwt');
const userService = require('../services/userService');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Token de autenticacion no proporcionado', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await userService.getUserById(decoded.id);
    if (!user) {
      return next(new AppError('Usuario no encontrado o inactivo', 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Token invalido o expirado', 401));
    }

    return next(error);
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Autenticacion requerida', 401));
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return next(new AppError('Permisos insuficientes', 403));
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};
