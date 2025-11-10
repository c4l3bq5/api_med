const { body, param, query } = require('express-validator');

const createMedicalHistoryValidation = [
  body('usuario_id')
    .isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer'),
  
  body('paciente_id')
    .isInt({ min: 1 }).withMessage('Patient ID must be a positive integer'),
  
  body('diagnostico')
    .notEmpty().withMessage('Diagnosis is required')
    .isLength({ max: 5000 }).withMessage('Diagnosis must not exceed 5000 characters'),
  
  body('tratamiento')
    .optional()
    .isLength({ max: 5000 }).withMessage('Treatment must not exceed 5000 characters'),
  
  body('foto_analizada')
    .optional()
    .isURL().withMessage('Analyzed photo must be a valid URL')
    .isLength({ max: 255 }).withMessage('Photo URL must not exceed 255 characters'),
  
  body('avance')
    .optional()
    .isLength({ max: 2000 }).withMessage('Progress notes must not exceed 2000 characters')
];

const updateMedicalHistoryValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  ...createMedicalHistoryValidation.map(validation => validation.optional())
];

const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

const patientIdValidation = [
  param('patientId')
    .isInt({ min: 1 }).withMessage('Patient ID must be a positive integer')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

module.exports = {
  createMedicalHistoryValidation,
  updateMedicalHistoryValidation,
  idValidation,
  patientIdValidation,
  paginationValidation
};