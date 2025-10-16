const { body, param, query } = require('express-validator');

const createPatientValidation = [
  body('persona_id')
    .isInt({ min: 1 }).withMessage('Person ID must be a positive integer'),
  
  body('grupo_sanguineo')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  
  body('alergias')
    .optional()
    .isLength({ max: 1000 }).withMessage('Allergies must not exceed 1000 characters'),
  
  body('antecedentes')
    .optional()
    .isLength({ max: 2000 }).withMessage('Medical history must not exceed 2000 characters'),
  
  body('estatura')
    .optional()
    .isFloat({ min: 0.5, max: 2.5 }).withMessage('Height must be between 0.5 and 2.5 meters'),
  
  body('provincia')
    .optional()
    .isLength({ max: 100 }).withMessage('Province must not exceed 100 characters')
];

const updatePatientValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  ...createPatientValidation.map(validation => validation.optional())
];

const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

const searchValidation = [
  query('q')
    .notEmpty().withMessage('Search term is required')
    .isLength({ min: 2 }).withMessage('Search term must be at least 2 characters')
];

module.exports = {
  createPatientValidation,
  updatePatientValidation,
  idValidation,
  searchValidation
};