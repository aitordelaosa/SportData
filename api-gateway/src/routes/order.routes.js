const express = require('express');
const { authenticate } = require('../middleware/auth');
const orderService = require('../services/orderService');

const router = express.Router();

router.use(authenticate);

router.get('/cart', async (req, res, next) => {
  try {
    const data = await orderService.listCart(req.token);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/cart/items', async (req, res, next) => {
  try {
    const data = await orderService.addCartItem(req.token, req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/cart/items/:productId', async (req, res, next) => {
  try {
    const data = await orderService.updateCartItem(req.token, req.params.productId, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.delete('/cart/items/:productId', async (req, res, next) => {
  try {
    const data = await orderService.deleteCartItem(req.token, req.params.productId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/favorites', async (req, res, next) => {
  try {
    const data = await orderService.listFavorites(req.token);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/favorites/:productId', async (req, res, next) => {
  try {
    const data = await orderService.addFavorite(req.token, req.params.productId);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.delete('/favorites/:productId', async (req, res, next) => {
  try {
    const data = await orderService.deleteFavorite(req.token, req.params.productId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const data = await orderService.listOrders(req.token);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/orders/checkout', async (req, res, next) => {
  try {
    const data = await orderService.checkout(req.token, req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
