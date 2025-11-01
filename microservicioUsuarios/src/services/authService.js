const AppError = require('../utils/appError');
const { hashPassword, comparePasswords } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const userService = require('./userService');
const { normalizeRole } = require('../utils/roles');

function sanitizeUser(userWithPassword) {
  const { passwordHash, ...rest } = userWithPassword;
  return rest;
}

async function registerUser({ nombre, email, password, direccion, rol }) {
  const passwordHash = await hashPassword(password);
  const roleToAssign = normalizeRole(rol);

  const user = await userService.createUser({
    nombre,
    email,
    passwordHash,
    direccion,
    rol: roleToAssign,
  });

  const token = generateToken({ id: user.id, rol: user.rol });

  return {
    user,
    token,
  };
}

async function loginUser({ email, password }) {
  const userRecord = await userService.getUserWithPasswordByEmail(email);
  if (!userRecord) {
    throw new AppError('Credenciales no validas', 401);
  }

  const passwordMatches = await comparePasswords(password, userRecord.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Credenciales no validas', 401);
  }

  const user = sanitizeUser(userRecord);
  const token = generateToken({ id: user.id, rol: user.rol });

  return { user, token };
}

module.exports = {
  registerUser,
  loginUser,
};
