const Patient = require('../models/Patient');
const Person = require('../models/Person');
const { validationResult } = require('express-validator');

const patientController = {
  // Get all patients
async getAll(req, res, next) {
  try {
    const { includeInactive } = req.query;
    
    const showOnlyActive = includeInactive !== 'true';
    
    const patients = await Patient.findAll(showOnlyActive);
    res.json({
      success: true,
      data: patients,
      total: patients.length
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

    const { persona, paciente } = req.body;

    // Verificar si ya existe una persona con ese CI
    const existingPerson = await Person.findByCI(persona.ci);
    if (existingPerson) {
      return res.status(409).json({
        success: false,
        message: 'A person with this CI already exists'
      });
    }

    // Crear la persona primero
    const newPerson = await Person.create(persona);
    
    // Crear el paciente vinculado a la persona
    const patientData = {
      persona_id: newPerson.id,
      ...paciente
    };

    const newPatient = await Patient.create(patientData);
    
    // Obtener el paciente completo con datos de persona
    const fullPatientData = await Patient.findById(newPatient.id);
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: fullPatientData
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

    // Extraer datos de persona y paciente del request
    const { 
      // Datos de persona
      nombre, a_paterno, a_materno, fech_nac, telefono, mail, ci, genero, domicilio,
      // Datos de paciente  
      grupo_sanguineo, alergias, antecedentes, estatura, provincia, activo 
    } = req.body;

    // Actualizar datos de la persona
    if (nombre || a_paterno || a_materno || fech_nac || telefono || mail || ci || genero || domicilio) {
      const personData = {
        nombre,
        a_paterno, 
        a_materno,
        fech_nac,
        telefono,
        mail,
        ci,
        genero,
        domicilio,
        activo: existingPatient.activo // Mantener el estado actual de la persona
      };
      
      await Person.update(existingPatient.persona_id, personData);
    }

    // Actualizar datos del paciente
    const patientData = {
      grupo_sanguineo,
      alergias, 
      antecedentes,
      estatura,
      provincia,
      activo
    };

    const updatedPatient = await Patient.update(id, patientData);
    
    // Obtener el paciente actualizado con los datos de persona
    const fullPatientData = await Patient.findById(id);
    
    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: fullPatientData
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