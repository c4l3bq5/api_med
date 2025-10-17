const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { requireAdmin } = require('../middleware/authorization');
const { authenticateToken } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const {
  createRoleValidation,
  updateRoleValidation,
  idValidation
} = require('../middleware/validators/roleValidation');

// Auditoría específica para cada endpoint
router.get('/',
  authenticateToken, 
  requireAdmin, 
  auditLogger('GET_ROLES', 'Consulta de todos los roles'),
  roleController.getAll
);

router.get('/initialize',
  authenticateToken, 
  requireAdmin, 
  auditLogger('INIT_ROLES', 'Inicialización de roles por defecto'),
  roleController.initializeDefaults
);

router.get('/name/:name',
  authenticateToken, 
  requireAdmin, 
  auditLogger('GET_ROLE_BY_NAME', 'Consulta de rol por nombre'),
  roleController.getByName
);

router.get('/:id',
  authenticateToken, 
  requireAdmin, 
  idValidation,
  auditLogger('GET_ROLE_BY_ID', 'Consulta de rol por ID'),
  roleController.getById
);

router.post('/',
  authenticateToken, 
  requireAdmin,
  createRoleValidation,
  auditLogger('CREATE_ROLE', 'Creación de nuevo rol'),
  roleController.create
);

router.put('/:id',
  authenticateToken, 
  requireAdmin,
  updateRoleValidation,
  auditLogger('UPDATE_ROLE', 'Actualización de rol existente'),
  roleController.update
);

module.exports = router;