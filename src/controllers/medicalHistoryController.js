const MedicalHistory = require('../models/MedicalHistory');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');

const medicalHistoryController = {
  // Get all medical histories
  async getAll(req, res, next) {
    try {
      const { active } = req.query;
      const includeInactive = active === 'false';
      
      const medicalHistories = await req.db.MedicalHistory.findAll(!includeInactive);
      res.json({
        success: true,
        data: medicalHistories,
        count: medicalHistories.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get medical history by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const medicalHistory = await req.db.MedicalHistory.findById(id);
      
      if (!medicalHistory) {
        return res.status(404).json({
          success: false,
          message: 'Medical history not found'
        });
      }

      res.json({
        success: true,
        data: medicalHistory
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new medical history - ACTUALIZADO
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { paciente_id } = req.body;

      // Tomar el usuario_id del token
      const usuario_id = req.user.id;

      // Check if doctor exists and is active
      const doctor = await req.db.User.findById(usuario_id);
      if (!doctor || doctor.activo !== 'activo') {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found or inactive'
        });
      }

      // Check if patient exists and is active
      const patient = await req.db.Patient.findById(paciente_id);
      if (!patient || patient.activo !== 'activo') {
        return res.status(404).json({
          success: false,
          message: 'Patient not found or inactive'
        });
      }

      // NUEVO: Generar ID personalizado
      const customId = await req.db.MedicalHistory.generateCustomId(paciente_id);

      const newMedicalHistory = await req.db.MedicalHistory.create({
        ...req.body,
        id: customId, // Usar ID personalizado
        usuario_id: usuario_id
      });
      
      res.status(201).json({
        success: true,
        message: 'Medical history created successfully',
        data: newMedicalHistory
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(404).json({
          success: false,
          message: 'Doctor or Patient not found'
        });
      }
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Medical history ID already exists'
        });
      }
      next(error);
    }
  },

  // Update medical history
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
      
      // Check if medical history exists
      const existingMedicalHistory = await req.db.MedicalHistory.findById(id);
      if (!existingMedicalHistory) {
        return res.status(404).json({
          success: false,
          message: 'Medical history not found'
        });
      }

      const updatedMedicalHistory = await req.db.MedicalHistory.update(id, req.body);
      
      res.json({
        success: true,
        message: 'Medical history updated successfully',
        data: updatedMedicalHistory
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete medical history (soft delete)
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      const existingMedicalHistory = await req.db.MedicalHistory.findById(id);
      if (!existingMedicalHistory) {
        return res.status(404).json({
          success: false,
          message: 'Medical history not found'
        });
      }

      if (existingMedicalHistory.activo === 'inactivo') {
        return res.status(400).json({
          success: false,
          message: 'Medical history is already inactive'
        });
      }

      const deactivatedMedicalHistory = await req.db.MedicalHistory.delete(id);
      
      res.json({
        success: true,
        message: 'Medical history deactivated successfully',
        data: deactivatedMedicalHistory
      });
    } catch (error) {
      next(error);
    }
  },

  // Get medical histories by patient ID
  async getByPatientId(req, res, next) {
    try {
      const { patientId } = req.params;
      
      // Check if patient exists
      const patient = await req.db.Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const medicalHistories = await req.db.MedicalHistory.findByPatientId(patientId);
      
      res.json({
        success: true,
        data: medicalHistories,
        count: medicalHistories.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get medical histories by patient ID with pagination
  async getByPatientIdPaginated(req, res, next) {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      // Check if patient exists
      const patient = await req.db.Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const result = await req.db.MedicalHistory.getByPatientWithPagination(
        patientId, 
        parseInt(page), 
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Get medical histories by doctor ID
  async getByDoctorId(req, res, next) {
    try {
      const { doctorId } = req.params;
      
      // Check if doctor exists
      const doctor = await req.db.User.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      const medicalHistories = await req.db.MedicalHistory.findByDoctorId(doctorId);
      
      res.json({
        success: true,
        data: medicalHistories,
        count: medicalHistories.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get medical history statistics
  async getStats(req, res, next) {
    try {
      const stats = await req.db.MedicalHistory.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = medicalHistoryController;