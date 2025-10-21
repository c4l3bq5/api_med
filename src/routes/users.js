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

router.patch(
  '/:id/password',
  authenticateToken, // Solo requiere autenticación, no admin
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { contrasena, es_temporal } = req.body;

      if (!contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Nueva contraseña es requerida'
        });
      }

      // Verificar que el usuario existe
      const existingUser = await req.db.User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Actualizar contraseña
      const updatedUser = await req.db.User.update(id, {
        contrasena,
        es_temporal: es_temporal !== undefined ? es_temporal : false
      });

      // No retornar datos sensibles
      const { contrasena: pwd, mfa_secreto, ...userSafe } = updatedUser;

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: {
          id: userSafe.id,
          usuario: userSafe.usuario,
          es_temporal: userSafe.es_temporal
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/users/:id/activate - Activate user
router.patch('/:id/activate', authenticateToken, requireAdmin, idValidation, userController.activate);

// PATCH /api/users/:id/enable-mfa - Enable MFA
router.patch('/:id/enable-mfa', authenticateToken, requireAdmin, idValidation, userController.enableMfa);

// PATCH /api/users/:id/disable-mfa - Disable MFA
router.patch('/:id/disable-mfa', authenticateToken, requireAdmin, idValidation, userController.disableMfa);

// POST /api/users - Create new user
router.post('/', authenticateToken, requireAdmin, createUserValidation, userController.create);

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, requireAdmin, updateUserValidation, userController.update);

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', authenticateToken, requireAdmin, idValidation, userController.delete);

module.exports = router;