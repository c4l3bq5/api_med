const pool = require('../config/database');

const auditLogger = (action, description) => {
  return async (req, res, next) => {
    // Guardar referencia original del método send
    const originalSend = res.send;
    
    // Sobrescribir el método send para capturar la respuesta
    res.send = function(data) {
      // Restaurar el método original
      res.send = originalSend;
      
      // Registrar en logs después de que la respuesta se envía
      if (res.statusCode < 400) { // Solo registrar acciones exitosas
        setTimeout(async () => {
          try {
            const userId = req.user ? req.user.id : null;
            await pool.query(
              'INSERT INTO logs (usuario_id, accion, descripcion) VALUES ($1, $2, $3)',
              [userId, action, description]
            );
          } catch (error) {
            console.error('Error registrando auditoría:', error);
          }
        }, 0);
      }
      
      // Llamar al método send original
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = auditLogger;