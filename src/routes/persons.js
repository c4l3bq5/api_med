const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const { requireAuth } = require('../middleware/authorization'); // ← AGREGAR
const {
  createPersonValidation,
  updatePersonValidation,
  idValidation,
  searchValidation
} = require('../middleware/validators/personValidation');

router.get('/', requireAuth, personController.getAll); 

router.get('/search', requireAuth, searchValidation, personController.search);

router.get('/:id', requireAuth, idValidation, personController.getById);

router.post('/', requireAuth, createPersonValidation, personController.create);

router.put('/:id', requireAuth, updatePersonValidation, personController.update);

router.delete('/:id', requireAuth, idValidation, personController.delete);

router.patch('/:id/activate', requireAuth, idValidation, personController.activate);

module.exports = router;