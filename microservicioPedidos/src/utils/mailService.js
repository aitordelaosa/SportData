const nodemailer = require('nodemailer');

let transporter;

function getMailConfig() {
  const user = process.env.MAIL_USER || '';
  const appPassword = process.env.MAIL_APP_PASSWORD || '';
  const from = process.env.MAIL_FROM || user || '';
  return { user, appPassword, from };
}

function isMailConfigured() {
  const { user, appPassword, from } = getMailConfig();
  return Boolean(user && appPassword && from);
}

function getTransporter() {
  if (transporter) return transporter;
  const { user, appPassword } = getMailConfig();
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass: appPassword,
    },
  });
  return transporter;
}

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

function buildOrderText(order) {
  const id = String(order?._id || '');
  const createdAt = order?.createdAt ? new Date(order.createdAt).toLocaleString('es-ES') : '';
  const lines = (order?.items || []).map(
    (item) => `- ${item.nombre} | ${item.quantity} uds | ${formatMoney(item.precio)} c/u`,
  );
  return [
    'Hemos recibido tu pedido en SportData.',
    '',
    `Pedido: ${id}`,
    createdAt ? `Fecha: ${createdAt}` : '',
    `Total: ${formatMoney(order?.total)}`,
    '',
    'Resumen de productos:',
    ...lines,
    '',
    'Gracias por tu compra.',
  ].filter(Boolean).join('\n');
}

async function sendOrderReceivedEmail({ to, order }) {
  if (!to || typeof to !== 'string') {
    return { sent: false, reason: 'missing-recipient' };
  }
  if (!isMailConfigured()) {
    return { sent: false, reason: 'mail-not-configured' };
  }

  const { from } = getMailConfig();
  try {
    await getTransporter().sendMail({
      from,
      to: to.trim(),
      subject: `Pedido recibido #${order?._id || ''}`,
      text: buildOrderText(order),
    });
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error?.code || 'smtp-error',
      message: error?.message || 'SMTP failure',
    };
  }
}

module.exports = {
  sendOrderReceivedEmail,
};
