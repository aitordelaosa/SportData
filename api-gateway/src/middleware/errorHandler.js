function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `Ruta ${req.originalUrl} no encontrada`,
  });
}

function errorHandler(err, req, res, next) {
  const status = err.response?.status || err.statusCode || err.status || 500;
  const message =
    err.response?.data?.message ||
    err.message ||
    'Error interno en el API Gateway';

  const payload = {
    message,
  };

  if (err.response?.data?.details) {
    payload.details = err.response.data.details;
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
