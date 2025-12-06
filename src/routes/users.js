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

// ==================== ENDPOINTS INTERNOS (Sin autenticación) ====================
//   Para llamadas desde microservicios internos (mfa-service)

// GET /api/users/:id/internal - Obtener usuario (interno)
router.get('/:id/internal', idValidation, userController.getById);

// PUT /api/users/:id/internal - Actualizar usuario (interno)
router.put('/:id/internal', updateUserValidation, userController.update);

// PATCH /api/users/:id/internal/password - Actualizar contraseña (interno)
router.patch('/:id/internal/password', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contrasena, es_temporal } = req.body;

    if (!contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Nueva contraseña es requerida'
      });
    }

    const existingUser = await req.db.User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const updatedUser = await req.db.User.update(id, {
      contrasena,
      es_temporal: es_temporal !== undefined ? es_temporal : false
    });

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
});

// ==================== ENDPOINTS EXTERNOS (Con autenticación) ====================

// GET /api/users - Get all users
router.get('/', authenticateToken, requireAdmin, userController.getAll);

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, requireAdmin, idValidation, userController.getById);

// PATCH /api/users/:id/password - Actualizar contraseña (usuario autenticado)
router.patch('/:id/password', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contrasena, es_temporal } = req.body;

    if (!contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Nueva contraseña es requerida'
      });
    }

    const existingUser = await req.db.User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const updatedUser = await req.db.User.update(id, {
      contrasena,
      es_temporal: es_temporal !== undefined ? es_temporal : false
    });

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
});

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