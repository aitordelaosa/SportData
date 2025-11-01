const AppError = require('../utils/appError');
const userService = require('../services/userService');
const { assertValidRole } = require('../utils/roles');

function getProfile(req, res) {
  res.json({
    message: 'Perfil de usuario obtenido correctamente',
    data: req.user,
  });
}

async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.json({
      message: 'Usuarios obtenidos correctamente',
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { nombre, email, direccion } = req.body;
    const updatedUser = await userService.updateUserProfile(req.user.id, {
      nombre,
      email,
      direccion,
    });

    res.json({
      message: 'Perfil actualizado correctamente',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

function getMyRole(req, res) {
  res.json({
    message: 'Rol del usuario obtenido correctamente',
    data: {
      rol: req.user.rol,
    },
  });
}

async function validateRole(req, res, next) {
  try {
    const { role } = req.params;
    assertValidRole(role);

    const isValid = await userService.userHasRole(req.user.id, role);
    res.json({
      message: 'Rol validado correctamente',
      data: {
        rol: role,
        valido: isValid,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    assertValidRole(rol);

    const updatedUser = await userService.updateUserRole(id, rol);
    if (!updatedUser) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      message: 'Rol actualizado correctamente',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  listUsers,
  updateProfile,
  getMyRole,
  validateRole,
  updateUserRole,
};
