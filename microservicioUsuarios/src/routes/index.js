const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

router.get('/', (req, res) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || 'http';
  const baseUrl = `${protocol}://${req.get('host')}`;

  res.json({
    status: 'ok',
    service: 'user-service',
    message: 'Usa /api/auth para autenticacion, /api/users para usuarios y /api/health para salud.',
    endpoints: {
      auth: `${baseUrl}/api/auth`,
      users: `${baseUrl}/api/users`,
      health: `${baseUrl}/api/health`,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
