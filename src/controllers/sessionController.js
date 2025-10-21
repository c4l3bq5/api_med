const Session = require('../models/Session');
const { validationResult } = require('express-validator');

const sessionController = {
  // Get active sessions (admin only)
  async getActiveSessions(req, res, next) {
    try {
      const activeSessions = await Session.getActiveSessions();
      
      res.json({
        success: true,
        data: activeSessions,
        count: activeSessions.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get sessions by user ID
  async getSessionsByUser(req, res, next) {
    try {
      const { userId } = req.params;
      
      const sessions = await Session.findByUserId(userId);
      
      res.json({
        success: true,
        data: sessions,
        count: sessions.length
      });
    } catch (error) {
      next(error);
    }
  },

  async createSession(req, res, next) {
    try {
      const { usuario_id, token } = req.body;

      if (!usuario_id || !token) {
        return res.status(400).json({
          success: false,
          message: 'usuario_id y token son requeridos'
        });
      }

      const User = require('../models/User');
      const user = await User.findById(usuario_id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Crear la sesión
      const newSession = await Session.create({
        usuario_id,
        token
      });

      res.status(201).json({
        success: true,
        message: 'Sesión creada exitosamente',
        data: newSession
      });

    } catch (error) {
      console.error('Error creating session:', error);
      next(error);
    }
  },

  // Close specific session (admin or own session)
  async closeSession(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;

      // Admin can close any session, users can only close their own
      if (req.user.rol_id !== 3) { // Not admin
        const session = await Session.findByToken(req.headers.authorization?.split(' ')[1]);
        if (!session || session.usuario_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only close your own sessions'
          });
        }
      }

      const closedSession = await Session.closeSessionById(id);
      
      if (!closedSession) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or already closed'
        });
      }

      res.json({
        success: true,
        message: 'Session closed successfully',
        data: closedSession
      });
    } catch (error) {
      next(error);
    }
  },

  // Close all sessions for a user (admin only)
  async closeAllUserSessions(req, res, next) {
    try {
      const { userId } = req.params;

      const closedSessions = await Session.closeAllUserSessions(userId);
      
      res.json({
        success: true,
        message: `Closed ${closedSessions.length} sessions for user`,
        data: closedSessions
      });
    } catch (error) {
      next(error);
    }
  },

  // Close current session (logout)
  async closeCurrentSession(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'No token provided'
        });
      }

      const closedSession = await Session.closeSession(token);
      
      if (!closedSession) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or already closed'
        });
      }

      res.json({
        success: true,
        message: 'Session closed successfully',
        data: closedSession
      });
    } catch (error) {
      next(error);
    }
  },

  // Get session statistics
  async getStats(req, res, next) {
    try {
      const stats = await Session.getSessionStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = sessionController;