const express = require('express');
const productService = require('../services/productService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await productService.listProducts(req.query);
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getProduct(req.params.id);
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    const product = await productService.createProduct(req.body);
    return res.status(201).json({ data: product });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    const product = await productService.updateProduct(req.params.id, req.body);
    return res.json({ data: product });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    const product = await productService.softDeleteProduct(req.params.id);
    return res.json({ data: product });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/stock', authenticate, async (req, res, next) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    const product = await productService.updateStock(req.params.id, req.body);
    return res.json({ data: product });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
