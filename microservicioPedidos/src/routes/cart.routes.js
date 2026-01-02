const express = require('express');
const CartItem = require('../models/CartItem');
const { authenticate } = require('../middleware/auth');
const { getProduct } = require('../utils/productClient');

const router = express.Router();

async function mapWithProduct(items) {
  const enriched = await Promise.all(
    items.map(async (item) => {
      try {
        const product = await getProduct(item.productId);
        return {
          ...item.toObject(),
          product,
        };
      } catch (error) {
        return {
          ...item.toObject(),
          product: null,
        };
      }
    }),
  );
  return enriched;
}

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const items = await CartItem.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    const data = await mapWithProduct(items);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body || {};
    if (!productId) {
      return res.status(400).json({ message: 'productId requerido' });
    }
    const product = await getProduct(productId);
    if (!product?.disponible) {
      return res.status(400).json({ message: 'Producto no disponible' });
    }
    const qty = Math.max(1, parseInt(quantity, 10));
    const existing = await CartItem.findOne({ userId: req.user.id, productId });
    const newQty = existing ? existing.quantity + qty : qty;
    const updated = await CartItem.findOneAndUpdate(
      { userId: req.user.id, productId },
      { quantity: newQty },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.status(existing ? 200 : 201).json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.patch('/items/:productId', async (req, res, next) => {
  try {
    const qty = parseInt(req.body?.quantity, 10);
    const { productId } = req.params;
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'quantity invalida' });
    }
    if (qty === 0) {
      await CartItem.deleteOne({ userId: req.user.id, productId });
      return res.json({ data: null });
    }
    const updated = await CartItem.findOneAndUpdate(
      { userId: req.user.id, productId },
      { quantity: qty },
      { new: true },
    );
    if (!updated) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

router.delete('/items/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    await CartItem.deleteOne({ userId: req.user.id, productId });
    res.json({ data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
