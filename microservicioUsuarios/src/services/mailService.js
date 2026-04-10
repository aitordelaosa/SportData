const nodemailer = require('nodemailer');
const config = require('../config/env');
const AppError = require('../utils/appError');

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!config.mail.user || !config.mail.appPassword) {
    throw new AppError('Servicio de correo no configurado', 503);
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.mail.user,
      pass: config.mail.appPassword,
    },
  });

  return transporter;
}

async function sendForgotPasswordEmail({ to, nombre, temporaryPassword }) {
  const sender = config.mail.from || config.mail.user;
  if (!sender) {
    throw new AppError('Remitente de correo no configurado', 503);
  }

  const message = [
    `Hola ${nombre || 'usuario'},`,
    '',
    'Hemos restablecido tu contrasena en SportData.',
    `Tu nueva contrasena temporal es: ${temporaryPassword}`,
    '',
    'Inicia sesion y cambiala desde tu perfil cuanto antes.',
  ].join('\n');

  try {
    await getTransporter().sendMail({
      from: sender,
      to,
      subject: 'Recuperacion de contrasena - SportData',
      text: message,
    });
  } catch (error) {
    const smtpMessage = error?.response || error?.message || 'Error SMTP desconocido';
    const smtpCode = error?.code || 'UNKNOWN';
    console.error('SMTP send error:', smtpCode, smtpMessage);
    throw new AppError('No se pudo enviar el correo de recuperacion', 502, [
      {
        field: 'smtp',
        message: `${smtpCode}: ${smtpMessage}`,
      },
    ]);
  }
}

module.exports = {
  sendForgotPasswordEmail,
};
