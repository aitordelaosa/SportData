const express = require('express');
const userService = require('../services/userService');
const { authenticate, extractToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: 'Permisos insuficientes' });
    }

    const token = extractToken(req);
    const payload = await userService.listUsers(token);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const token = extractToken(req);
    const payload = await userService.getProfile(token);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const token = extractToken(req);
    const payload = await userService.updateProfile(token, req.body);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
