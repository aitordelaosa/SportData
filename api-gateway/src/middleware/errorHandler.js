function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `Ruta ${req.originalUrl} no encontrada`,
  });
}

function errorHandler(err, req, res, next) {
  const remoteDetail = err.response?.data?.detail;
  const detailMessage = typeof remoteDetail === 'string' ? remoteDetail : null;
  const status = err.response?.status || err.statusCode || err.status || 500;
  const message =
    err.response?.data?.message ||
    detailMessage ||
    err.message ||
    'Error interno en el API Gateway';

  const payload = {
    message,
  };

  if (err.response?.data?.details) {
    payload.details = err.response.data.details;
  } else if (Array.isArray(remoteDetail)) {
    payload.details = remoteDetail;
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
