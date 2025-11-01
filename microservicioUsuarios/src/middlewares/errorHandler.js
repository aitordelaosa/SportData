const AppError = require('../utils/appError');
const { app } = require('../config/env');

function notFoundHandler(req, res, next) {
  next(new AppError(`Ruta ${req.originalUrl} no encontrada`, 404));
}

function errorHandler(err, req, res, next) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const response = {
    message: err.message || 'Error interno del servidor',
  };

  if (err.details) {
    response.details = err.details;
  }

  if (app.env !== 'production' && !(err instanceof AppError)) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
