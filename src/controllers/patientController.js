const Patient = require('../models/Patient');
const Person = require('../models/Person');
const { validationResult } = require('express-validator');

const patientController = {
  // Get all patients
  async getAll(req, res, next) {
    try {
      const { active } = req.query;
      const includeInactive = active === 'false';
      
      const patients = await Patient.findAll(!includeInactive);
      res.json({
        success: true,
        data: patients,
        count: patients.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get patient by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new patient
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { persona_id } = req.body;

      // Check if person exists
      const person = await Person.findById(persona_id);
      if (!person) {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }

      // Check if person is already a patient
      const existingPatient = await Patient.findByPersonId(persona_id);
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: 'This person is already registered as a patient'
        });
      }

      const newPatient = await Patient.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: newPatient
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Patient already exists'
        });
      }
      if (error.code === '23503') {
        return res.status(404).json({
          success: false,
          message: 'Person not found'
        });
      }
      next(error);
    }
  },

  // Update patient
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
      
      // Check if patient exists
      const existingPatient = await Patient.findById(id);
      if (!existingPatient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const updatedPatient = await Patient.update(id, req.body);
      
      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: updatedPatient
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete patient (soft delete)
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingPatient = await Patient.findById(id);
      if (!existingPatient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      if (existingPatient.activo === 'inactivo') {
        return res.status(400).json({
          success: false,
          message: 'Patient is already inactive'
        });
      }

      const deactivatedPatient = await Patient.delete(id);
      
      res.json({
        success: true,
        message: 'Patient deactivated successfully',
        data: deactivatedPatient
      });
    } catch (error) {
      next(error);
    }
  },

  // Activate patient
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingPatient = await Patient.findById(id);
      if (!existingPatient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      if (existingPatient.activo === 'activo') {
        return res.status(400).json({
          success: false,
          message: 'Patient is already active'
        });
      }

      const activatedPatient = await Patient.activate(id);
      
      res.json({
        success: true,
        message: 'Patient activated successfully',
        data: activatedPatient
      });
    } catch (error) {
      next(error);
    }
  },

  // Search patients
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
      const results = await Patient.search(q);
      
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get patient by CI
  async getByCI(req, res, next) {
    try {
      const { ci } = req.params;
      const patient = await Patient.findByCI(ci);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      next(error);
    }
  },

  // Get patient statistics
  async getStats(req, res, next) {
    try {
      const stats = await Patient.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = patientController;