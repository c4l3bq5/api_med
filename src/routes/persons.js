const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const { requireAuth, requireAdmin } = require('../middleware/authorization');
const { authenticateToken } = require('../middleware/auth');
const {
  createPersonValidation,
  updatePersonValidation,
  idValidation,
  searchValidation
} = require('../middleware/validators/personValidation');

router.get('/', authenticateToken, requireAuth, personController.getAll); 

router.get('/search', authenticateToken, requireAuth, searchValidation, personController.search);

router.get('/:id', authenticateToken, requireAuth, idValidation, personController.getById);

router.post('/', authenticateToken, requireAuth, createPersonValidation, personController.create);

router.put('/:id', authenticateToken, requireAuth, updatePersonValidation, personController.update);

router.delete('/:id', authenticateToken, requireAuth, requireAdmin, idValidation, personController.delete);

router.patch('/:id/activate', authenticateToken, requireAuth, requireAdmin, idValidation, personController.activate);

module.exports = router;