const express = require('express');
const userController = require('../controllers/userController');
const validateRequest = require('../middlewares/validateRequest');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');
const { updateProfileValidator, updateRoleValidator } = require('../validators/userValidators');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorizeRoles('admin'),
  userController.listUsers,
);
router.get('/me', authenticate, userController.getProfile);
router.put(
  '/me',
  authenticate,
  updateProfileValidator,
  validateRequest,
  userController.updateProfile,
);
router.get('/me/role', authenticate, userController.getMyRole);
router.get('/me/role/:role', authenticate, userController.validateRole);

router.patch(
  '/:id/role',
  authenticate,
  authorizeRoles('admin'),
  updateRoleValidator,
  validateRequest,
  userController.updateUserRole,
);

module.exports = router;
