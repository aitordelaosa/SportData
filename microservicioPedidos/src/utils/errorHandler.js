function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('[orders-service] error', err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  const message = err.message || 'Error inesperado';
  return res.status(status).json({ message });
}

module.exports = errorHandler;
