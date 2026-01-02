const express = require('express');
const cartRoutes = require('./cart.routes');
const favoritesRoutes = require('./favorites.routes');
const ordersRoutes = require('./orders.routes');

const router = express.Router();

router.use('/cart', cartRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
