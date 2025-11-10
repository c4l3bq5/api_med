const { body, param, query } = require('express-validator');

const createPersonValidation = [
  body('nombre')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('a_paterno')
    .optional()
    .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters'),
  
  body('a_materno')
    .optional()
    .isLength({ max: 100 }).withMessage('Mother\'s last name must not exceed 100 characters'),
  
  body('fech_nac')
    .notEmpty().withMessage('Birth date is required')
    .isDate().withMessage('Birth date must be a valid date'),
  
  body('telefono')
    .optional()
    .isLength({ min: 8, max: 8 }).withMessage('Phone must be exactly 8 digits')
    .isNumeric().withMessage('Phone must contain only numbers'),
  
  body('mail')
    .optional()
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('ci')
    .notEmpty().withMessage('CI is required')
    .isLength({ min: 7, max: 7 }).withMessage('CI must be exactly 7 digits')
    .isNumeric().withMessage('CI must contain only numbers'),
  
  body('genero')
  .optional()
  .isIn(['M', 'F', 'Masculino', 'Femenino', 'Otro']).withMessage('Invalid gender'),
  
  body('domicilio')
    .optional()
    .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters')
];

const updatePersonValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  ...createPersonValidation.map(validation => validation.optional())
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
  createPersonValidation,
  updatePersonValidation,
  idValidation,
  searchValidation
};