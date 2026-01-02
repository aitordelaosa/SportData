const express = require('express');
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const { authenticate } = require('../middleware/auth');
const { getProduct } = require('../utils/productClient');

const router = express.Router();

function cleanString(value) {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function detectCardBrand(number = '') {
  const digits = String(number || '').replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MasterCard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(36|38|30[0-5])/.test(digits)) return 'Diners';
  if (/^6/.test(digits)) return 'Discover';
  if (/^35/.test(digits)) return 'JCB';
  return undefined;
}

function buildShipping(raw = {}) {
  const shipping = {
    nombre: cleanString(raw.nombre),
    apellidos: cleanString(raw.apellidos),
    direccion: cleanString(raw.direccion),
    ciudad: cleanString(raw.ciudad),
    provincia: cleanString(raw.provincia),
    pais: cleanString(raw.pais),
    cp: cleanString(raw.cp),
    telefono: cleanString(raw.telefono),
    email: cleanString(raw.email),
    notas: cleanString(raw.notas),
    fechaNacimiento: cleanString(raw.fechaNacimiento),
  };
  return Object.values(shipping).some((value) => value) ? shipping : null;
}

function buildPayment(raw = {}) {
  const digits = String(raw.cardNumber || raw.last4 || '').replace(/\D/g, '');
  const last4 = digits ? digits.slice(-4) : cleanString(raw.last4);
  const remember = raw.remember === true;
  const payment = {
    method: cleanString(raw.method) || (digits ? 'card' : undefined),
    brand: cleanString(raw.brand) || detectCardBrand(digits),
    last4: last4 || undefined,
    holder: cleanString(raw.holder),
    expMonth: cleanString(raw.expMonth),
    expYear: cleanString(raw.expYear),
    country: cleanString(raw.country),
    remember: remember ? true : undefined,
  };
  const hasValue = [
    payment.method,
    payment.brand,
    payment.last4,
    payment.holder,
    payment.expMonth,
    payment.expYear,
    payment.country,
  ].some((value) => value !== undefined && value !== null && value !== '');
  if (!hasValue && !remember) {
    return null;
  }
  if (!payment.method) {
    payment.method = 'card';
  }
  return payment;
}

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ data: orders });
  } catch (error) {
    next(error);
  }
});

router.post('/checkout', async (req, res, next) => {
  try {
    const cartItems = await CartItem.find({ userId: req.user.id });
    if (!cartItems.length) {
      return res.status(400).json({ message: 'El carrito esta vacio' });
    }
    const shipping = buildShipping(req.body?.shipping || {});
    const payment = buildPayment(req.body?.payment || {});

    const items = [];
    let total = 0;

    for (const item of cartItems) {
      const product = await getProduct(item.productId);
      if (!product || !product.disponible) {
        return res.status(400).json({ message: `Producto no disponible: ${item.productId}` });
      }
      const price = Number(product.precio) || 0;
      const lineTotal = price * item.quantity;
      total += lineTotal;
      items.push({
        productId: item.productId,
        nombre: product.nombre || 'Producto',
        precio: price,
        quantity: item.quantity,
        imagen_url: product.imagen_url,
      });
    }

    const order = await Order.create({
      userId: req.user.id,
      total,
      status: 'created',
      items,
      shipping,
      payment,
    });

    await CartItem.deleteMany({ userId: req.user.id });

    return res.status(201).json({ data: order });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
