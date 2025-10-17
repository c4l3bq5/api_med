const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorization');
const {
  createUserValidation,
  updateUserValidation,
  idValidation
} = require('../middleware/validators/userValidation');

// GET /api/users - Get all users
router.get('/', authenticateToken, requireAdmin, userController.getAll);

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, requireAdmin, idValidation, userController.getById);

// POST /api/users - Create new user
router.post('/', authenticateToken, requireAdmin, createUserValidation, userController.create);

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, requireAdmin, updateUserValidation, userController.update);

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', authenticateToken, requireAdmin, idValidation, userController.delete);

// PATCH /api/users/:id/activate - Activate user
router.patch('/:id/activate', authenticateToken, requireAdmin, idValidation, userController.activate);

// PATCH /api/users/:id/enable-mfa - Enable MFA
router.patch('/:id/enable-mfa', authenticateToken, requireAdmin, idValidation, userController.enableMfa);

// PATCH /api/users/:id/disable-mfa - Disable MFA
router.patch('/:id/disable-mfa', authenticateToken, requireAdmin, idValidation, userController.disableMfa);

module.exports = router;