const AppError = require('./appError');
const { USER_ROLES, DEFAULT_USER_ROLE } = require('../config/constants');

function assertValidRole(role) {
  if (!USER_ROLES.includes(role)) {
    throw new AppError(
      `Rol no válido. Roles permitidos: ${USER_ROLES.join(', ')}`,
      400,
    );
  }
}

function normalizeRole(role) {
  if (!role) {
    return DEFAULT_USER_ROLE;
  }
  assertValidRole(role);
  return role;
}

module.exports = {
  assertValidRole,
  normalizeRole,
};
