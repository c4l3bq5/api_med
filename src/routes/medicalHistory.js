const express = require('express');
const router = express.Router();
const medicalHistoryController = require('../controllers/medicalHistoryController');
const { 
  requireAuth, 
  requireMedicoOrInterno, 
  requireMedicoInternoOrAdmin,
  requireMedicoOnly,
  requireAdmin 
} = require('../middleware/authorization');
const {
  createMedicalHistoryValidation,
  updateMedicalHistoryValidation,
  idValidation,
  patientIdValidation,
  paginationValidation
} = require('../middleware/validators/medicalHistoryValidation');

// GET /api/medical-history - Get all medical histories (médicos, internos Y admin - SOLO READ)
router.get('/', requireMedicoInternoOrAdmin, medicalHistoryController.getAll);

// GET /api/medical-history/stats - Get statistics (médicos, internos Y admin - SOLO READ)
router.get('/stats', requireMedicoInternoOrAdmin, medicalHistoryController.getStats);

// GET /api/medical-history/patient/:patientId - Get by patient ID (médicos, internos Y admin - SOLO READ)
router.get('/patient/:patientId', requireMedicoInternoOrAdmin, patientIdValidation, medicalHistoryController.getByPatientId);

// GET /api/medical-history/patient/:patientId/paginated - Get by patient ID with pagination (médicos, internos Y admin - SOLO READ)
router.get('/patient/:patientId/paginated', requireMedicoInternoOrAdmin, patientIdValidation, paginationValidation, medicalHistoryController.getByPatientIdPaginated);

// GET /api/medical-history/doctor/:doctorId - Get by doctor ID (médicos, internos Y admin - SOLO READ)
router.get('/doctor/:doctorId', requireMedicoInternoOrAdmin, medicalHistoryController.getByDoctorId);

// GET /api/medical-history/:id - Get by ID (médicos, internos Y admin - SOLO READ)
router.get('/:id', requireMedicoInternoOrAdmin, idValidation, medicalHistoryController.getById);

// POST /api/medical-history - Create new medical history (SOLO médicos - CREATE)
router.post('/', requireMedicoOnly, createMedicalHistoryValidation, medicalHistoryController.create);

// PUT /api/medical-history/:id - Update medical history (SOLO médicos - UPDATE)
router.put('/:id', requireMedicoOnly, updateMedicalHistoryValidation, medicalHistoryController.update);

// DELETE /api/medical-history/:id - Deactivate medical history (SOLO médicos - DELETE lógico)
router.delete('/:id', requireMedicoOnly, idValidation, medicalHistoryController.delete);

module.exports = router;