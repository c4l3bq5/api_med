const { body, param } = require('express-validator');

const createRoleValidation = [
  body('nombre')
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z_]+$/).withMessage('Role name can only contain letters and underscores')
];

const updateRoleValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  body('nombre')
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z_]+$/).withMessage('Role name can only contain letters and underscores')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

module.exports = {
  createRoleValidation,
  updateRoleValidation,
  idValidation
};