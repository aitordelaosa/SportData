const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();

router.get('/', (req, res) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || 'http';
  const baseUrl = `${protocol}://${req.get('host')}`;

  res.json({
    status: 'ok',
    service: 'api-gateway',
    message: 'Usa /docs para Swagger UI y /openapi.json para la especificacion OpenAPI.',
    docs: `${baseUrl}/docs`,
    openapi: `${baseUrl}/openapi.json`,
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/', orderRoutes);

module.exports = router;
