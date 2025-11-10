const { param, query } = require('express-validator');

const logFiltersValidation = [
  query('usuario_id')
    .optional()
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  
  query('accion')
    .optional()
    .isLength({ max: 100 }).withMessage('Action must not exceed 100 characters'),
  
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const userIdValidation = [
  param('userId')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

module.exports = {
  logFiltersValidation,
  userIdValidation,
  idValidation
};