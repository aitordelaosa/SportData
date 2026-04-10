const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { user, token } = await authService.registerUser(req.body);
    res.status(201).json({
      message: 'Usuario registrado correctamente',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { user, token } = await authService.loginUser(req.body);
    res.status(200).json({
      message: 'Inicio de sesion exitoso',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body);
    res.status(200).json({
      message: 'Si existe una cuenta para ese email, se ha enviado un correo con una contrasena temporal',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
};
