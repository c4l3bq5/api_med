const { body, param } = require('express-validator');

const createUserValidation = [
  body('persona_id')
    .isInt({ min: 1 }).withMessage('Person ID must be a positive integer'),
  
  body('rol_id')
    .isInt({ min: 1 }).withMessage('Role ID must be a positive integer'),
  
  body('usuario')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
  
  body('mfa_secreto')
    .optional()
    .isLength({ max: 255 }).withMessage('MFA secret must not exceed 255 characters'),
  
  body('mfa_activo')
    .optional()
    .isBoolean().withMessage('MFA active must be a boolean')
];

const updateUserValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  body('rol_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Role ID must be a positive integer'),
  
  body('usuario')
    .optional()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
  
  body('contrasena')
    .optional()
    .isLength({ min: 6 }).withMessage('contrasenaword must be at least 6 characters'),
  
  body('mfa_secreto')
    .optional()
    .isLength({ max: 255 }).withMessage('MFA secret must not exceed 255 characters'),
  
  body('mfa_activo')
    .optional()
    .isBoolean().withMessage('MFA active must be a boolean'),
  
  body('activo')
    .optional()
    .isIn(['activo', 'inactivo']).withMessage('Active must be "activo" or "inactivo"')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

const loginValidation = [
  body('usuario')
    .notEmpty().withMessage('Username is required'),
  
  body('contrasena')
    .notEmpty().withMessage('contrasenaword is required')
];

const mfaValidation = [
  body('codigo_mfa')
    .notEmpty().withMessage('MFA code is required')
    .isLength({ min: 6, max: 6 }).withMessage('MFA code must be 6 digits')
    .isNumeric().withMessage('MFA code must contain only numbers')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  idValidation,
  loginValidation,
  mfaValidation
};