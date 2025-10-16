const User = require('../models/User');
const Person = require('../models/Person');
const Role = require('../models/Role');
const { validationResult } = require('express-validator');

const userController = {
  // Get all users
  async getAll(req, res, next) {
    try {
      const { active } = req.query;
      const includeInactive = active === 'false';
      
      const users = await User.findAll(!includeInactive);
      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new user
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { persona_id, rol_id, usuario } = req.body;

      // Check if person exists
      const person = await Person.findById(persona_id);
      if (!person) {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }

      // Check if role exists
      const role = await Role.findById(rol_id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if username already exists
      const existingUser = await User.findByUsername(usuario);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Check if person already has a user
      const existingPersonUser = await User.findByPersonId(persona_id);
      if (existingPersonUser) {
        return res.status(409).json({
          success: false,
          message: 'This person already has a user account'
        });
      }

      const newUser = await User.create(req.body);
      
      // Remove contrasenaword from response
      const {contrasena, ...userWithoutcontrasenaword } = newUser;
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userWithoutcontrasenaword
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
      if (error.code === '23503') {
        return res.status(404).json({
          success: false,
          message: 'Person or Role not found'
        });
      }
      next(error);
    }
  },

  // Update user
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
      
      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if new username already exists (excluding current user)
      if (req.body.usuario) {
        const userWithSameUsername = await User.findByUsername(req.body.usuario);
        if (userWithSameUsername && userWithSameUsername.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            message: 'Username already exists'
          });
        }
      }

      // Check if role exists (if updating role)
      if (req.body.rol_id) {
        const role = await Role.findById(req.body.rol_id);
        if (!role) {
          return res.status(404).json({
            success: false,
            message: 'Role not found'
          });
        }
      }

      const updatedUser = await User.update(id, req.body);
      
      // Remove contrasenaword from response
      const {contrasena, ...userWithoutcontrasenaword } = updatedUser;
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: userWithoutcontrasenaword
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
      next(error);
    }
  },

  // Delete user (soft delete)
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (existingUser.activo === 'inactivo') {
        return res.status(400).json({
          success: false,
          message: 'User is already inactive'
        });
      }

      const deactivatedUser = await User.delete(id);
      
      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: deactivatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  // Activate user
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (existingUser.activo === 'activo') {
        return res.status(400).json({
          success: false,
          message: 'User is already active'
        });
      }

      const activatedUser = await User.activate(id);
      
      res.json({
        success: true,
        message: 'User activated successfully',
        data: activatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  // Enable MFA for user
  async enableMfa(req, res, next) {
    try {
      const { id } = req.params;
      const { mfa_secreto } = req.body;

      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await User.updateMfaSecret(id, mfa_secreto);
      
      res.json({
        success: true,
        message: 'MFA enabled successfully',
        data: { mfa_activo: updatedUser.mfa_activo }
      });
    } catch (error) {
      next(error);
    }
  },

  // Disable MFA for user
  async disableMfa(req, res, next) {
    try {
      const { id } = req.params;

      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await User.disableMfa(id);
      
      res.json({
        success: true,
        message: 'MFA disabled successfully',
        data: { mfa_activo: updatedUser.mfa_activo }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;