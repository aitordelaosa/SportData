const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
    }));
    return next(new AppError('Error de validación', 422, formatted));
  }
  return next();
}

module.exports = validateRequest;
