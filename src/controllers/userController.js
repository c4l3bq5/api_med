const { validationResult } = require('express-validator');

const userController = {
  // Get all users
  async getAll(req, res, next) {
    try {
      const { active } = req.query;
      const includeInactive = active === 'false';
      
      // USAR req.db.User en lugar de User directo
      const users = await req.db.User.findAll(!includeInactive);
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
      // USAR req.db.User
      const user = await req.db.User.findById(id);
      
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

      // Check if person exists - USAR req.db.Person
      const person = await req.db.Person.findById(persona_id);
      if (!person) {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }

      // Check if role exists - USAR req.db.Role
      const role = await req.db.Role.findById(rol_id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if username already exists - USAR req.db.User
      const existingUser = await req.db.User.findByUsername(usuario);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Check if person already has a user
      const existingPersonUser = await req.db.User.findByPersonId(persona_id);
      if (existingPersonUser) {
        return res.status(409).json({
          success: false,
          message: 'This person already has a user account'
        });
      }

      // USAR req.db.User
      const newUser = await req.db.User.create(req.body);
      
      // Remove password from response
      const { contrasena, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userWithoutPassword
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

  // ... resto de los métodos actualizados de la misma manera
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
      
      // USAR req.db.User
      const existingUser = await req.db.User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (req.body.usuario) {
        const userWithSameUsername = await req.db.User.findByUsername(req.body.usuario);
        if (userWithSameUsername && userWithSameUsername.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            message: 'Username already exists'
          });
        }
      }

      if (req.body.rol_id) {
        const role = await req.db.Role.findById(req.body.rol_id);
        if (!role) {
          return res.status(404).json({
            success: false,
            message: 'Role not found'
          });
        }
      }

      const updatedUser = await req.db.User.update(id, req.body);
      const { contrasena, ...userWithoutPassword } = updatedUser;
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: userWithoutPassword
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

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingUser = await req.db.User.findById(id);
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

      const deactivatedUser = await req.db.User.delete(id);
      
      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: deactivatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  async enableMfa(req, res, next) {
  try {
    const { id } = req.params;
    const { mfa_secreto } = req.body;

    const existingUser = await req.db.User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await req.db.User.updateMfaSecret(id, mfa_secreto);
    
    res.json({
      success: true,
      message: 'MFA enabled successfully',
      data: { mfa_activo: updatedUser.mfa_activo }
    });
  } catch (error) {
    next(error);
  }
},

async disableMfa(req, res, next) {
  try {
    const { id } = req.params;

    const existingUser = await req.db.User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await req.db.User.disableMfa(id);
    
    res.json({
      success: true,
      message: 'MFA disabled successfully',
      data: { mfa_activo: updatedUser.mfa_activo }
    });
  } catch (error) {
    next(error);
  }
},

  async activate(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingUser = await req.db.User.findById(id);
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

      const activatedUser = await req.db.User.activate(id);
      
      res.json({
        success: true,
        message: 'User activated successfully',
        data: activatedUser
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;