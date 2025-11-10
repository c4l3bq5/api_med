const pool = require('../config/database');

class Session {
  static async create(sessionData) {
    const { usuario_id, token } = sessionData;

    const query = `
      INSERT INTO sesiones (usuario_id, token)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await pool.query(query, [usuario_id, token]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = 'SELECT * FROM sesiones WHERE token = $1 AND fin_sesion IS NULL';
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async findByUserId(usuario_id) {
    const query = 'SELECT * FROM sesiones WHERE usuario_id = $1 ORDER BY inicio_sesion DESC';
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  }

  static async getActiveSessions() {
    const query = `
      SELECT s.*, u.usuario, p.nombre, p.a_paterno 
      FROM sesiones_activas s
      JOIN usuario u ON s.usuario_id = u.id
      JOIN persona p ON u.persona_id = p.id
      ORDER BY s.inicio_sesion DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async closeSession(token) {
    const query = `
      UPDATE sesiones 
      SET fin_sesion = CURRENT_TIMESTAMP 
      WHERE token = $1 AND fin_sesion IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async closeAllUserSessions(usuario_id) {
    const query = `
      UPDATE sesiones 
      SET fin_sesion = CURRENT_TIMESTAMP 
      WHERE usuario_id = $1 AND fin_sesion IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  }

  static async closeSessionById(session_id) {
    const query = `
      UPDATE sesiones 
      SET fin_sesion = CURRENT_TIMESTAMP 
      WHERE id = $1 AND fin_sesion IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [session_id]);
    return result.rows[0];
  }

  static async getSessionStats() {
    const query = `
      SELECT 
        COUNT(*) as total_sesiones,
        COUNT(CASE WHEN fin_sesion IS NULL THEN 1 END) as sesiones_activas,
        COUNT(DISTINCT usuario_id) as usuarios_activos
      FROM sesiones
      WHERE DATE(inicio_sesion) = CURRENT_DATE
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Session;