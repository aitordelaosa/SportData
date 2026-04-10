const express = require('express');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { registerValidator, loginValidator, forgotPasswordValidator } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, authController.register);
router.post('/login', loginValidator, validateRequest, authController.login);
router.post('/forgot-password', forgotPasswordValidator, validateRequest, authController.forgotPassword);

module.exports = router;
