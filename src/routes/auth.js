const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  loginValidation,
  mfaValidation
} = require('../middleware/validators/authValidation');

// POST /api/auth/login - Login
router.post('/login', loginValidation, authController.login);

// POST /api/auth/verify-mfa - Verificar código MFA
router.post('/verify-mfa', mfaValidation, authController.verifyMfa);

// GET /api/auth/verify - Verificar token actual
router.get('/verify', authenticateToken, authController.verify);

router.get('/me', authenticateToken, authController.me); 

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;