const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { requireAdmin } = require('../middleware/authorization');
const { authenticateToken } = require('../middleware/auth');
const {
  logFiltersValidation,
  userIdValidation,
  idValidation
} = require('../middleware/validators/logValidation');

// TODAS las rutas de logs requieren ser administrador (datos sensibles)

// GET /api/logs - Get all logs with filters (admin only)
router.get('/', authenticateToken, requireAdmin, logFiltersValidation, logController.getAll);

// GET /api/logs/stats - Get log statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, logController.getStats);

// GET /api/logs/actions-summary - Get actions summary (admin only)
router.get('/actions-summary', authenticateToken, requireAdmin, logController.getActionsSummary);

// GET /api/logs/recent - Get recent activity (admin only)
router.get('/recent', authenticateToken, requireAdmin, logController.getRecentActivity);

// GET /api/logs/user/:userId - Get logs by user ID (admin only)
router.get('/user/:userId', authenticateToken, requireAdmin, userIdValidation, logController.getByUserId);

// GET /api/logs/:id - Get log by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, idValidation, logController.getById);

module.exports = router;