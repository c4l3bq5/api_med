const Log = require('../models/Log');
const { validationResult } = require('express-validator');

const logController = {
  // Get all logs with filters
  async getAll(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const filters = {
        usuario_id: req.query.usuario_id,
        accion: req.query.accion,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const logs = await Log.findAll(filters);
      
      res.json({
        success: true,
        data: logs,
        count: logs.length,
        page: filters.page,
        limit: filters.limit
      });
    } catch (error) {
      next(error);
    }
  },

  // Get log by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const log = await Log.findById(id);
      
      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Log not found'
        });
      }

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      next(error);
    }
  },

  // Get logs by user ID
  async getByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const logs = await Log.findByUserId(userId, parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data: logs,
        count: logs.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      next(error);
    }
  },

  // Get log statistics
  async getStats(req, res, next) {
    try {
      const stats = await Log.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // Get actions summary
  async getActionsSummary(req, res, next) {
    try {
      const summary = await Log.getActionsSummary();
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  },

  // Get recent activity
  async getRecentActivity(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const activity = await Log.getRecentActivity(parseInt(limit));
      
      res.json({
        success: true,
        data: activity,
        count: activity.length
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = logController;