const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado y tenga rol
    if (!req.user || !req.user.rol_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    // Si el array de roles permitidos está vacío, permitir acceso a todos los roles autenticados
    if (allowedRoles.length === 0) {
      return next();
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(req.user.rol_id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware específico para administradores
const requireAdmin = authorize([3]);
const requireMedicoOrAdmin = authorize([1, 3]);
const requireMedicoOrInterno = authorize([1, 2]);
const requireMedicoOnly = authorize([1]);
const requireMedicoInternoOrAdmin = authorize([1, 2, 3]);
const requireAuth = authorize([]);

module.exports = {
  authorize,
  requireAdmin,
  requireMedicoOrAdmin,
  requireMedicoOrInterno,
  requireMedicoOnly,
  requireMedicoInternoOrAdmin,
  requireAuth
};