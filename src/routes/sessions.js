const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');
const { requireAuth, requireAdmin } = require('../middleware/authorization');
const {
  closeSessionValidation,
  userIdValidation
} = require('../middleware/validators/sessionValidation');

// GET /api/sessions/active - Get active sessions (admin only)
router.get('/active', authenticateToken, requireAdmin, sessionController.getActiveSessions);

// GET /api/sessions/stats - Get session statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, sessionController.getStats);

// GET /api/sessions/user/:userId - Get sessions by user ID (admin or own user)
router.get('/user/:userId', authenticateToken, requireAuth, userIdValidation, sessionController.getSessionsByUser);

// POST /api/sessions/logout - Close current session (any authenticated user)
router.post('/logout', authenticateToken, requireAuth, sessionController.closeCurrentSession);

// DELETE /api/sessions/:id - Close specific session (admin or own session)
router.delete('/:id', authenticateToken, requireAuth, closeSessionValidation, sessionController.closeSession);

// DELETE /api/sessions/user/:userId - Close all sessions for user (admin only)
router.delete('/user/:userId', authenticateToken, requireAdmin, userIdValidation, sessionController.closeAllUserSessions);

module.exports = router;