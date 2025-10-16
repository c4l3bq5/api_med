const Role = require('../models/Role');
const { validationResult } = require('express-validator');
const auditLogger = require('../middleware/auditLogger');

const roleController = {
  // Get all roles
  async getAll(req, res, next) {
    try {
      const { all } = req.query;
      const includeAll = all === 'true';
      
      const roles = await Role.findAll(!includeAll);
      res.json({
        success: true,
        data: roles,
        count: roles.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get role by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const role = await Role.findById(id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new role
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { nombre } = req.body;

      // Check if role name already exists
      const existingRole = await Role.findByName(nombre);
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists'
        });
      }

      const newRole = await Role.create({ nombre });
      
      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: newRole
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists'
        });
      }
      next(error);
    }
  },

  // Update role
  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { nombre } = req.body;

      // Check if role exists
      const existingRole = await Role.findById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if new name already exists (excluding current role)
      const roleWithSameName = await Role.findByName(nombre);
      if (roleWithSameName && roleWithSameName.id !== parseInt(id)) {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists'
        });
      }

      const updatedRole = await Role.update(id, { nombre });
      
      res.json({
        success: true,
        message: 'Role updated successfully',
        data: updatedRole
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists'
        });
      }
      next(error);
    }
  },

  // Initialize default roles
  async initializeDefaults(req, res, next) {
    try {
      await Role.initializeDefaultRoles();
      
      const roles = await Role.findAll();
      
      res.json({
        success: true,
        message: 'Default roles initialized successfully',
        data: roles
      });
    } catch (error) {
      next(error);
    }
  },

  // Get role by name
  async getByName(req, res, next) {
    try {
      const { name } = req.params;
      const role = await Role.findByName(name);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = roleController;