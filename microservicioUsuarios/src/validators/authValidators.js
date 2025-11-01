const { body } = require('express-validator');
const { USER_ROLES } = require('../config/constants');

const registerValidator = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 120 })
    .withMessage('El nombre debe tener como maximo 120 caracteres'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('El email debe tener un formato valido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contrasena debe tener al menos 8 caracteres'),
  body('direccion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 250 })
    .withMessage('La direccion debe tener como maximo 250 caracteres'),
  body('rol')
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`El rol debe ser uno de los siguientes: ${USER_ROLES.join(', ')}`),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('El email debe tener un formato valido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contrasena es obligatoria'),
];

module.exports = {
  registerValidator,
  loginValidator,
};
