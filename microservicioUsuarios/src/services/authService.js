const crypto = require('crypto');
const AppError = require('../utils/appError');
const { hashPassword, comparePasswords } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const userService = require('./userService');
const { normalizeRole } = require('../utils/roles');
const mailService = require('./mailService');

function sanitizeUser(userWithPassword) {
  const { passwordHash, ...rest } = userWithPassword;
  return rest;
}

function generateTemporaryPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?';
  const bytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i += 1) {
    password += chars[bytes[i] % chars.length];
  }

  return password;
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

async function forgotPassword({ email }) {
  const userRecord = await userService.getUserWithPasswordByEmail(email);
  if (!userRecord) {
    return;
  }

  const temporaryPassword = generateTemporaryPassword();
  const nextPasswordHash = await hashPassword(temporaryPassword);

  await userService.updateUserPasswordHash(userRecord.id, nextPasswordHash);

  try {
    await mailService.sendForgotPasswordEmail({
      to: userRecord.email,
      nombre: userRecord.nombre,
      temporaryPassword,
    });
  } catch (error) {
    await userService.updateUserPasswordHash(userRecord.id, userRecord.passwordHash);
    throw error instanceof AppError
      ? error
      : new AppError('No se pudo completar la recuperacion de contrasena', 500);
  }
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
};
