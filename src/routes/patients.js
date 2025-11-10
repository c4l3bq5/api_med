const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken } = require('../middleware/auth');
const { requireAuth, requireMedicoOrAdmin, requireAdmin  } = require('../middleware/authorization');
const {
  createPatientValidation,
  updatePatientValidation,
  idValidation,
  searchValidation
} = require('../middleware/validators/patientValidation');

// GET /api/patients - Get all patients (médicos y admin)
router.get('/', authenticateToken,requireMedicoOrAdmin, patientController.getAll);

// GET /api/patients/stats - Get patient statistics (médicos y admin)
router.get('/stats', authenticateToken,requireMedicoOrAdmin, patientController.getStats);

// GET /api/patients/search - Search patients (médicos y admin)
router.get('/search', authenticateToken,requireMedicoOrAdmin, searchValidation, patientController.search);

// GET /api/patients/ci/:ci - Get patient by CI (médicos y admin)
router.get('/ci/:ci', authenticateToken,requireMedicoOrAdmin, patientController.getByCI);

// GET /api/patients/:id - Get patient by ID (médicos y admin)
router.get('/:id', authenticateToken,requireMedicoOrAdmin, idValidation, patientController.getById);

// POST /api/patients - Create new patient (médicos y admin)
router.post('/', authenticateToken,requireMedicoOrAdmin, createPatientValidation, patientController.create);

// PUT /api/patients/:id - Update patient (médicos y admin)
router.put('/:id', authenticateToken,requireMedicoOrAdmin, updatePatientValidation, patientController.update);

// DELETE /api/patients/:id - Deactivate patient (SOLO admin)
router.delete('/:id', authenticateToken,requireAdmin, idValidation, patientController.delete);

// PATCH /api/patients/:id/activate - Activate patient (SOLO admin)
router.patch('/:id/activate', authenticateToken,requireAdmin, idValidation, patientController.activate);

module.exports = router;