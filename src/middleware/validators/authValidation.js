const { body } = require('express-validator');

const loginValidation = [
  body('usuario')
    .notEmpty().withMessage('Username is required'),
  
  body('contrasena')
    .notEmpty().withMessage('contrasenaword is required')
];

const mfaValidation = [
  body('tempToken')
    .notEmpty().withMessage('Temporary token is required'),
  
  body('codigo_mfa')
    .notEmpty().withMessage('MFA code is required')
    .isLength({ min: 6, max: 6 }).withMessage('MFA code must be 6 digits')
    .isNumeric().withMessage('MFA code must contain only numbers')
];

module.exports = {
  loginValidation,
  mfaValidation
};