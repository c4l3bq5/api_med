const { body, param } = require('express-validator');

const closeSessionValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Session ID must be a positive integer')
];

const userIdValidation = [
  param('userId')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
];

module.exports = {
  closeSessionValidation,
  userIdValidation
};