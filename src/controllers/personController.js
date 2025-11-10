const Person = require('../models/Person');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const personController = {
  // Get all persons
  async getAll(req, res, next) {
    try {
      const { active } = req.query;
      const includeInactive = active === 'false';
      
      const persons = await Person.findAll(!includeInactive);
      res.json({
        success: true,
        data: persons,
        count: persons.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get person by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const person = await Person.findById(id);
      
      if (!person) {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }

      res.json({
        success: true,
        data: person
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new person
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Check if CI already exists
      const existingCI = await Person.findByCI(req.body.ci);
      if (existingCI) {
        return res.status(409).json({
          success: false,
          message: 'A person with this CI already exists'
        });
      }

      // Check if email already exists
      if (req.body.mail) {
        const existingEmail = await Person.findByEmail(req.body.mail);
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: 'A person with this email already exists'
          });
        }
      }

      const newPerson = await Person.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Person created successfully',
        data: newPerson
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Duplicate error: CI or email already exists'
        });
      }
      next(error);
    }
  },

  // Update person
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
      
      // Check if person exists
      const existingPerson = await Person.findById(id);
      if (!existingPerson) {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }

      if (req.user.rol_id !== 3) { // No es admin
  // Médicos solo pueden editar pacientes
  if (req.user.rol_id === 1) { // Es médico
    const isPatient = await Patient.findByPersonId(id);
    if (!isPatient) {
      return res.status(403).json({
        success: false,
        message: 'Doctors can only edit patients'
      });
    }
  } else {
    // Internos y otros roles no pueden editar
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to edit persons'
    });
  }
}

      const userExists = await User.findByPersonId(id);
      if (userExists && req.user.rol_id !== 3) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can edit persons who are system users'
        });
      }

      // Check CI duplicates (excluding current person)
      if (req.body.ci) {
        const existingCI = await Person.findByCI(req.body.ci);
        if (existingCI && existingCI.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            message: 'Another person with this CI already exists'
          });
        }
      }

      // Check email duplicates (excluding current person)
      if (req.body.mail) {
        const existingEmail = await Person.findByEmail(req.body.mail);
        if (existingEmail && existingEmail.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            message: 'Another person with this email already exists'
          });
        }
      }

      const updatedPerson = await Person.update(id, req.body);
      
      res.json({
        success: true,
        message: 'Person updated successfully',
        data: updatedPerson
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Duplicate error: CI or email already exists'
        });
      }
      next(error);
    }
  },

  // Delete person (soft delete)
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingPerson = await Person.findById(id);
      if (!existingPerson) {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }

      if (req.user.rol_id !== 3) { // No es admin
  // Médicos solo pueden editar pacientes
  if (req.user.rol_id === 1) { // Es médico
    const isPatient = await Patient.findByPersonId(id);
    if (!isPatient) {
      return res.status(403).json({
        success: false,
        message: 'Doctors can only edit patients'
      });
    }
  } else {
    // Internos y otros roles no pueden editar
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to edit persons'
    });
  }
}

      const userExists = await User.findByPersonId(id);
      if (userExists && req.user.rol_id !== 3) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can deactivate persons who are system users'
        });
      }

      if (existingPerson.activo === 'inactivo') {
        return res.status(400).json({
          success: false,
          message: 'Person is already inactive'
        });
      }

      const deactivatedPerson = await Person.delete(id);
      
      res.json({
        success: true,
        message: 'Person deactivated successfully',
        data: deactivatedPerson
      });
    } catch (error) {
      next(error);
    }
  },

  // Activate person
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingPerson = await Person.findById(id);
      if (!existingPerson) {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }

      if (existingPerson.activo === 'activo') {
        return res.status(400).json({
          success: false,
          message: 'Person is already active'
        });
      }

      const activatedPerson = await Person.activate(id);
      
      res.json({
        success: true,
        message: 'Person activated successfully',
        data: activatedPerson
      });
    } catch (error) {
      next(error);
    }
  },

  // Search persons
  async search(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { q } = req.query;
      const results = await Person.search(q);
      
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = personController;