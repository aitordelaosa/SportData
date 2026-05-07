const express = require('express');
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const { authenticate } = require('../middleware/auth');
const { getProduct } = require('../utils/productClient');
const { sendOrderReceivedEmail } = require('../utils/mailService');

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

function normalizedGroupLabel(path, fallbackLabel) {
  return {
    $let: {
      vars: {
        normalized: {
          $trim: {
            input: {
              $toLower: {
                $toString: {
                  $ifNull: [path, ''],
                },
              },
            },
          },
        },
      },
      in: {
        $cond: [{ $eq: ['$$normalized', ''] }, fallbackLabel, '$$normalized'],
      },
    },
  };
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

router.get('/admin/stats', async (req, res, next) => {
  try {
    if (String(req.user?.rol || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    const [stats] = await Order.aggregate([
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRevenue: {
                  $sum: { $ifNull: ['$total', 0] },
                },
                totalOrders: { $sum: 1 },
                uniqueCustomersRaw: {
                  $addToSet: {
                    $trim: {
                      input: {
                        $toString: {
                          $ifNull: ['$userId', ''],
                        },
                      },
                    },
                  },
                },
                totalProductsSold: {
                  $sum: {
                    $reduce: {
                      input: { $ifNull: ['$items', []] },
                      initialValue: 0,
                      in: {
                        $add: ['$$value', { $ifNull: ['$$this.quantity', 0] }],
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalRevenue: { $round: ['$totalRevenue', 2] },
                totalOrders: 1,
                averageTicket: {
                  $cond: [
                    { $gt: ['$totalOrders', 0] },
                    { $round: [{ $divide: ['$totalRevenue', '$totalOrders'] }, 2] },
                    0,
                  ],
                },
                uniqueCustomers: {
                  $size: {
                    $filter: {
                      input: '$uniqueCustomersRaw',
                      as: 'customerId',
                      cond: { $ne: ['$$customerId', ''] },
                    },
                  },
                },
                totalProductsSold: 1,
              },
            },
          ],
          salesByMonth: [
            {
              $addFields: {
                orderDate: { $ifNull: ['$createdAt', '$updatedAt'] },
              },
            },
            {
              $match: {
                orderDate: { $type: 'date' },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m',
                    date: '$orderDate',
                  },
                },
                revenue: {
                  $sum: { $ifNull: ['$total', 0] },
                },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                month: '$_id',
                revenue: { $round: ['$revenue', 2] },
                orders: 1,
              },
            },
          ],
          ordersByStatus: [
            {
              $group: {
                _id: normalizedGroupLabel('$status', 'sin estado'),
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
              },
            },
            { $sort: { count: -1, status: 1 } },
          ],
          topProducts: [
            {
              $unwind: {
                path: '$items',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: normalizedGroupLabel('$items.nombre', 'producto sin nombre'),
                quantity: {
                  $sum: { $ifNull: ['$items.quantity', 0] },
                },
                revenue: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ['$items.quantity', 0] },
                      { $ifNull: ['$items.precio', 0] },
                    ],
                  },
                },
              },
            },
            {
              $match: {
                quantity: { $gt: 0 },
              },
            },
            {
              $project: {
                _id: 0,
                name: '$_id',
                quantity: 1,
                revenue: { $round: ['$revenue', 2] },
              },
            },
            { $sort: { quantity: -1, revenue: -1, name: 1 } },
            { $limit: 5 },
          ],
          topProductsByMonth: [
            {
              $addFields: {
                orderDate: { $ifNull: ['$createdAt', '$updatedAt'] },
              },
            },
            {
              $match: {
                orderDate: { $type: 'date' },
              },
            },
            {
              $unwind: {
                path: '$items',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: {
                  month: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: '$orderDate',
                    },
                  },
                  name: normalizedGroupLabel('$items.nombre', 'producto sin nombre'),
                },
                quantity: {
                  $sum: { $ifNull: ['$items.quantity', 0] },
                },
                revenue: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ['$items.quantity', 0] },
                      { $ifNull: ['$items.precio', 0] },
                    ],
                  },
                },
              },
            },
            {
              $match: {
                quantity: { $gt: 0 },
              },
            },
            { $sort: { '_id.month': 1, quantity: -1, revenue: -1, '_id.name': 1 } },
            {
              $group: {
                _id: '$_id.month',
                topProduct: {
                  $first: {
                    name: '$_id.name',
                    quantity: '$quantity',
                    revenue: { $round: ['$revenue', 2] },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                month: '$_id',
                name: '$topProduct.name',
                quantity: '$topProduct.quantity',
                revenue: '$topProduct.revenue',
              },
            },
            { $sort: { month: 1 } },
          ],
          paymentMethods: [
            {
              $group: {
                _id: normalizedGroupLabel('$payment.method', 'sin metodo'),
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                method: '$_id',
                count: 1,
              },
            },
            { $sort: { count: -1, method: 1 } },
          ],
          ordersByCountry: [
            {
              $group: {
                _id: normalizedGroupLabel('$shipping.pais', 'sin pais'),
                orders: { $sum: 1 },
                revenue: {
                  $sum: { $ifNull: ['$total', 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                country: '$_id',
                orders: 1,
                revenue: { $round: ['$revenue', 2] },
              },
            },
            { $sort: { orders: -1, revenue: -1, country: 1 } },
            { $limit: 10 },
          ],
          ordersByProvince: [
            {
              $group: {
                _id: normalizedGroupLabel('$shipping.provincia', 'sin provincia'),
                orders: { $sum: 1 },
                revenue: {
                  $sum: { $ifNull: ['$total', 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                province: '$_id',
                orders: 1,
                revenue: { $round: ['$revenue', 2] },
              },
            },
            { $sort: { orders: -1, revenue: -1, province: 1 } },
            { $limit: 10 },
          ],
        },
      },
    ]);

    const summary = stats?.summary?.[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageTicket: 0,
      uniqueCustomers: 0,
      totalProductsSold: 0,
    };

    return res.json({
      summary,
      salesByMonth: stats?.salesByMonth || [],
      ordersByStatus: stats?.ordersByStatus || [],
      topProducts: stats?.topProducts || [],
      topProductsByMonth: stats?.topProductsByMonth || [],
      paymentMethods: stats?.paymentMethods || [],
      ordersByCountry: stats?.ordersByCountry || [],
      ordersByProvince: stats?.ordersByProvince || [],
    });
  } catch (error) {
    return next(error);
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

    const recipientEmail = shipping?.email;
    sendOrderReceivedEmail({ to: recipientEmail, order })
      .then((result) => {
        if (!result?.sent) {
          // eslint-disable-next-line no-console
          console.warn('[orders-service] order email not sent', {
            orderId: String(order._id),
            reason: result?.reason || 'unknown',
          });
        }
      })
      .catch((mailError) => {
        // eslint-disable-next-line no-console
        console.error('[orders-service] order email error', {
          orderId: String(order._id),
          error: mailError?.message || 'unknown',
        });
      });

    return res.status(201).json({ data: order });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
