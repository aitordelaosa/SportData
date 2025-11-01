const express = require('express');
const userService = require('../services/userService');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const payload = await userService.registerUser(req.body);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const payload = await userService.loginUser(req.body);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
