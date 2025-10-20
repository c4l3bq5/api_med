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
// En patientController.js, reemplaza el método update():

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
    
    // Verificar que el paciente existe
    const existingPatient = await req.db.Patient.findById(id);
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

    // Actualizar datos de la persona si se envían
    const personaDataToUpdate = {};
    if (nombre !== undefined) personaDataToUpdate.nombre = nombre;
    if (a_paterno !== undefined) personaDataToUpdate.a_paterno = a_paterno;
    if (a_materno !== undefined) personaDataToUpdate.a_materno = a_materno;
    if (fech_nac !== undefined) personaDataToUpdate.fech_nac = fech_nac;
    if (telefono !== undefined) personaDataToUpdate.telefono = telefono;
    if (mail !== undefined) personaDataToUpdate.mail = mail;
    if (ci !== undefined) personaDataToUpdate.ci = ci;
    if (genero !== undefined) personaDataToUpdate.genero = genero;
    if (domicilio !== undefined) personaDataToUpdate.domicilio = domicilio;

    // Si hay datos de persona para actualizar
    if (Object.keys(personaDataToUpdate).length > 0) {
      await req.db.Person.update(existingPatient.persona_id, personaDataToUpdate);
    }

    // Actualizar datos del paciente si se envían
    const patientDataToUpdate = {};
    if (grupo_sanguineo !== undefined) patientDataToUpdate.grupo_sanguineo = grupo_sanguineo;
    if (alergias !== undefined) patientDataToUpdate.alergias = alergias;
    if (antecedentes !== undefined) patientDataToUpdate.antecedentes = antecedentes;
    if (estatura !== undefined) patientDataToUpdate.estatura = estatura;
    if (provincia !== undefined) patientDataToUpdate.provincia = provincia;
    if (activo !== undefined) patientDataToUpdate.activo = activo;

    // Si hay datos de paciente para actualizar
    if (Object.keys(patientDataToUpdate).length > 0) {
      await req.db.Patient.update(id, patientDataToUpdate);
    }

    // Obtener el paciente actualizado completo
    const fullPatientData = await req.db.Patient.findById(id);
    
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