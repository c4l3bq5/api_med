const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findAll(active = null) {
    let query = `
      SELECT u.*, p.nombre, p.a_paterno, p.a_materno, p.mail, r.nombre as rol_nombre
      FROM usuario u
      JOIN persona p ON u.persona_id = p.id
      JOIN roles r ON u.rol_id = r.id
    `;
    
    const params = [];
    
    // Si se pasa un parámetro active, filtra; si no, devuelve todos
    if (active !== null) {
      query += `WHERE u.activo = $1`;
      params.push(active ? 'activo' : 'inactivo');
    }
    
    query += ` ORDER BY u.id DESC`;
    
    const result = params.length > 0 
      ? await pool.query(query, params)
      : await pool.query(query);
    
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT u.*, p.nombre, p.a_paterno, p.a_materno, p.mail, r.nombre as rol_nombre
      FROM usuario u
      JOIN persona p ON u.persona_id = p.id
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUsername(usuario) {
    const query = `
      SELECT u.*, p.nombre, p.a_paterno, p.a_materno, p.mail, r.nombre as rol_nombre
      FROM usuario u
      JOIN persona p ON u.persona_id = p.id
      JOIN roles r ON u.rol_id = r.id
      WHERE u.usuario = $1
    `;
    const result = await pool.query(query, [usuario]);
    return result.rows[0];
  }

  static async findByPersonId(persona_id) {
    const query = 'SELECT * FROM usuario WHERE persona_id = $1';
    const result = await pool.query(query, [persona_id]);
    return result.rows[0];
  }

  static async create(userData) {
    const {
      persona_id,
      rol_id,
      usuario,
      contrasena,
      mfa_secreto,
      mfa_activo = false
    } = userData;

    // Hash contraseña
    const hashedContrasena = await bcrypt.hash(contrasena, 12);

    const query = `
      INSERT INTO usuario 
      (persona_id, rol_id, usuario, contrasena, mfa_secreto, mfa_activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      persona_id,
      rol_id,
      usuario,
      hashedContrasena,
      mfa_secreto,
      mfa_activo
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // REEMPLAZA SOLO el método update() en User.js

static async update(id, userData) {
  const {
    rol_id,
    usuario,
    contrasena,
    mfa_secreto,
    mfa_activo,
    activo
  } = userData;

  // Construir dinámicamente la query basada en qué campos se envíen
  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Solo agregar campos que se envíen (no undefined)
  if (rol_id !== undefined) {
    updates.push(`rol_id = $${paramIndex++}`);
    values.push(rol_id);
  }

  if (usuario !== undefined) {
    updates.push(`usuario = $${paramIndex++}`);
    values.push(usuario);
  }

  if (contrasena !== undefined) {
    const hashedContrasena = await bcrypt.hash(contrasena, 12);
    updates.push(`contrasena = $${paramIndex++}`);
    values.push(hashedContrasena);
  }

  if (mfa_secreto !== undefined) {
    updates.push(`mfa_secreto = $${paramIndex++}`);
    values.push(mfa_secreto);
  }

  if (mfa_activo !== undefined) {
    updates.push(`mfa_activo = $${paramIndex++}`);
    values.push(mfa_activo);
  }

  if (activo !== undefined) {
    updates.push(`activo = $${paramIndex++}`);
    values.push(activo);
  }

  // Si no hay campos para actualizar, devolver el usuario existente
  if (updates.length === 0) {
    const query = `SELECT * FROM usuario WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Agregar el ID al final
  values.push(id);

  const query = `
    UPDATE usuario 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  console.log('Update query:', query);
  console.log('Update values:', values);

  const result = await pool.query(query, values);
  return result.rows[0];
}

  static async delete(id) {
    const query = `
      UPDATE usuario 
      SET activo = 'inactivo' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async activate(id) {
    const query = `
      UPDATE usuario 
      SET activo = 'activo' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyContrasena(plainContrasena, hashedContrasena) {
    return await bcrypt.compare(plainContrasena, hashedContrasena);
  }

  static async updateMfaSecret(id, mfa_secreto) {
    const query = `
      UPDATE usuario 
      SET mfa_secreto = $1, mfa_activo = true 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [mfa_secreto, id]);
    return result.rows[0];
  }

  static async disableMfa(id) {
    const query = `
      UPDATE usuario 
      SET mfa_secreto = NULL, mfa_activo = false 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

static async incrementFailedAttempts(userId) {
  const query = `
    UPDATE usuario 
    SET intentos_fallidos = intentos_fallidos + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING intentos_fallidos
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error incrementing failed attempts:', error);
    throw error;
  }
}

static async resetFailedAttempts(userId) {
  const query = `
    UPDATE usuario 
    SET intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
    throw error;
  }
}

static async updateLastLogin(userId) {
  const query = `
    UPDATE usuario 
    SET ultimo_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING ultimo_login
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
}

static async changeTemporaryPassword(userId, newPasswordHash) {
  const query = `
    UPDATE usuario 
    SET contrasena = $1,
        es_temporal = FALSE,
        intentos_fallidos = 0,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, usuario, es_temporal
  `;
  
  try {
    const result = await pool.query(query, [newPasswordHash, userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error changing temporary password:', error);
    throw error;
  }
}

}

module.exports = User;