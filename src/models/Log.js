const pool = require('../config/database');

class Log {
  static async findAll(filters = {}) {
    const { 
      usuario_id, 
      accion, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT l.*, u.usuario, p.nombre, p.a_paterno
      FROM logs l
      LEFT JOIN usuario u ON l.usuario_id = u.id
      LEFT JOIN persona p ON u.persona_id = p.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    if (usuario_id) {
      paramCount++;
      query += ` AND l.usuario_id = $${paramCount}`;
      values.push(usuario_id);
    }

    if (accion) {
      paramCount++;
      query += ` AND l.accion ILIKE $${paramCount}`;
      values.push(`%${accion}%`);
    }

    if (startDate) {
      paramCount++;
      query += ` AND l.timestamp >= $${paramCount}`;
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND l.timestamp <= $${paramCount}`;
      values.push(endDate);
    }

    query += ` ORDER BY l.timestamp DESC`;

    // Paginación
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT l.*, u.usuario, p.nombre, p.a_paterno
      FROM logs l
      LEFT JOIN usuario u ON l.usuario_id = u.id
      LEFT JOIN persona p ON u.persona_id = p.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(usuario_id, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT l.*, u.usuario, p.nombre, p.a_paterno
      FROM logs l
      LEFT JOIN usuario u ON l.usuario_id = u.id
      LEFT JOIN persona p ON u.persona_id = p.id
      WHERE l.usuario_id = $1
      ORDER BY l.timestamp DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [usuario_id, limit, offset]);
    return result.rows;
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT usuario_id) as usuarios_activos,
        COUNT(CASE WHEN timestamp >= CURRENT_DATE THEN 1 END) as logs_hoy,
        COUNT(CASE WHEN accion LIKE '%INSERT%' THEN 1 END) as inserciones,
        COUNT(CASE WHEN accion LIKE '%UPDATE%' THEN 1 END) as actualizaciones,
        COUNT(CASE WHEN accion LIKE '%DELETE%' THEN 1 END) as eliminaciones
      FROM logs
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  static async getActionsSummary() {
    const query = `
      SELECT 
        accion,
        COUNT(*) as cantidad,
        MAX(timestamp) as ultima_ejecucion
      FROM logs
      GROUP BY accion
      ORDER BY cantidad DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getRecentActivity(limit = 10) {
    const query = `
      SELECT l.*, u.usuario, p.nombre, p.a_paterno
      FROM logs l
      LEFT JOIN usuario u ON l.usuario_id = u.id
      LEFT JOIN persona p ON u.persona_id = p.id
      ORDER BY l.timestamp DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Método para crear logs manualmente (si es necesario)
  static async create(logData) {
    const { usuario_id, accion, descripcion } = logData;

    const query = `
      INSERT INTO logs (usuario_id, accion, descripcion)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [usuario_id, accion, descripcion]);
    return result.rows[0];
  }
}

module.exports = Log;