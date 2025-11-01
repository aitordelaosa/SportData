const { body, param } = require('express-validator');
const { USER_ROLES } = require('../config/constants');

const updateProfileValidator = [
  body('nombre')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 1 })
    .withMessage('El nombre no puede estar vacio')
    .isLength({ max: 120 })
    .withMessage('El nombre debe tener como maximo 120 caracteres'),
  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage('El email debe tener un formato valido')
    .normalizeEmail(),
  body('direccion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 250 })
    .withMessage('La direccion debe tener como maximo 250 caracteres'),
  body('password')
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 8 })
    .withMessage('La contrasena debe tener al menos 8 caracteres'),
];

const updateRoleValidator = [
  param('id')
    .isMongoId()
    .withMessage('El identificador del usuario debe ser un ObjectId valido'),
  body('rol')
    .notEmpty()
    .withMessage('El rol es obligatorio')
    .isIn(USER_ROLES)
    .withMessage(`El rol debe ser uno de los siguientes: ${USER_ROLES.join(', ')}`),
];

module.exports = {
  updateProfileValidator,
  updateRoleValidator,
};
