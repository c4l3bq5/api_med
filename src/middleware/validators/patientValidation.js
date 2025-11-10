const { body, param, query } = require('express-validator');

const createPatientValidation = [
  body('persona_id')
    .notEmpty().withMessage('Person ID is required')
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
  
  // Remover la validación de persona_id para update
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
    .isLength({ max: 100 }).withMessage('Province must not exceed 100 characters'),
  
  // Agregar validaciones para los campos de persona
  body('nombre')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  
  body('a_paterno')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
  
  body('a_materno')
    .optional()
    .isLength({ max: 100 }).withMessage('Middle name must not exceed 100 characters'),
  
  body('fech_nac')
    .optional()
    .isISO8601().withMessage('Birth date must be a valid date'),
  
  body('telefono')
    .optional()
    .isLength({ max: 20 }).withMessage('Phone must not exceed 20 characters'),
  
  body('mail')
    .optional()
    .isEmail().withMessage('Must be a valid email'),
  
  body('ci')
    .optional()
    .isLength({ min: 1, max: 20 }).withMessage('CI must be between 1 and 20 characters'),
  
  body('genero')
    .optional()
    .isIn(['M', 'F', 'Masculino', 'Femenino']).withMessage('Gender must be M, F, Masculino or Femenino'),
  
  body('domicilio')
    .optional()
    .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters'),
  
  body('activo')
    .optional()
    .isIn(['activo', 'inactivo']).withMessage('Status must be activo or inactivo')
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