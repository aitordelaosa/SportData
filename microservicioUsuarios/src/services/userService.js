const mongoose = require('mongoose');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { hashPassword } = require('../utils/password');

function mapUser(doc) {
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    email: doc.email,
    direccion: doc.direccion ?? null,
    rol: doc.rol,
    fechaRegistro: doc.fechaRegistro,
    fechaActualizacion: doc.fechaActualizacion,
  };
}

function normalizeId(id) {
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  return null;
}

async function ensureEmailAvailable(email, ignoreUserId = null) {
  const filter = { email: email.toLowerCase() };
  if (ignoreUserId && mongoose.Types.ObjectId.isValid(ignoreUserId)) {
    filter._id = { $ne: ignoreUserId };
  }

  const existing = await User.exists(filter);
  if (existing) {
    throw new AppError('El correo electronico ya esta registrado', 409);
  }
}

async function getUserById(id) {
  const validId = normalizeId(id);
  if (!validId) {
    return null;
  }

  const user = await User.findById(validId).lean();
  return mapUser(user);
}

async function getUserByEmail(email) {
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  return mapUser(user);
}

async function getUserWithPasswordByEmail(email) {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+passwordHash')
    .lean();

  if (!user) {
    return null;
  }

  return {
    ...mapUser(user),
    passwordHash: user.passwordHash,
  };
}

async function createUser({ nombre, email, passwordHash, direccion, rol }) {
  await ensureEmailAvailable(email);

  const user = await User.create({
    nombre,
    email,
    passwordHash,
    direccion,
    rol,
  });

  return mapUser(user.toObject());
}

async function updateUserProfile(userId, updates) {
  const validId = normalizeId(userId);
  if (!validId) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const updateData = {};
  if (typeof updates.nombre === 'string') {
    updateData.nombre = updates.nombre;
  }
  if (typeof updates.email === 'string') {
    updateData.email = updates.email.toLowerCase();
  }
  if (typeof updates.direccion === 'string') {
    updateData.direccion = updates.direccion;
  } else if (updates.direccion === null) {
    updateData.direccion = null;
  }

  if (updateData.email) {
    await ensureEmailAvailable(updateData.email, validId);
  }

  if (typeof updates.password === 'string') {
    const trimmedPassword = updates.password.trim();
    if (trimmedPassword.length === 0) {
      throw new AppError('La contrasena no puede estar vacia', 400);
    }
    updateData.passwordHash = await hashPassword(trimmedPassword);
  }

  if (Object.keys(updateData).length === 0) {
    const current = await User.findById(validId).lean();
    if (!current) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return mapUser(current);
  }

  const user = await User.findByIdAndUpdate(validId, updateData, { new: true, lean: true });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return mapUser(user);
}

async function updateUserRole(userId, rol) {
  const validId = normalizeId(userId);
  if (!validId) {
    return null;
  }

  const user = await User.findByIdAndUpdate(validId, { rol }, { new: true, lean: true });
  return mapUser(user);
}

async function listUsers() {
  const users = await User.find().sort({ fechaRegistro: -1 }).lean();
  return users.map(mapUser);
}

async function userHasRole(userId, role) {
  const validId = normalizeId(userId);
  if (!validId) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const user = await User.findById(validId, 'rol').lean();
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return user.rol === role;
}

module.exports = {
  getUserById,
  getUserByEmail,
  getUserWithPasswordByEmail,
  createUser,
  updateUserProfile,
  updateUserRole,
  listUsers,
  userHasRole,
};
