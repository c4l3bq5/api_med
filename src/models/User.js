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

  // 🔥 Crea un usuario con contraseña temporal
  static async createWithTempPassword(userData) {
    const {
      persona_id,
      rol_id,
      usuario,
      mfa_secreto,
      mfa_activo = false
    } = userData;

    // 🔐 Generar contraseña temporal aleatoria (8 caracteres)
    const tempPassword = this.generateTempPassword();
    const hashedContrasena = await bcrypt.hash(tempPassword, 12);

    const query = `
      INSERT INTO usuario 
      (persona_id, rol_id, usuario, contrasena, mfa_secreto, mfa_activo, es_temporal)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
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
    
    // ✅ Retornar el usuario Y la contraseña temporal (sin hashear)
    return {
      user: result.rows[0],
      tempPassword: tempPassword // 🔥 IMPORTANTE: Solo para mostrarlo al admin
    };
  }

  // 🔥 Genera contraseña temporal aleatoria
  static generateTempPassword(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // 🔥 CORREGIDO: Soporte para contraseñas pre-hasheadas
  static async update(id, userData) {
    const {
      rol_id,
      usuario,
      contrasena,
      contrasena_hasheada, // 🔥 NUEVO: Para contraseñas ya hasheadas
      mfa_secreto,
      mfa_activo,
      activo,
      es_temporal
    } = userData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (rol_id !== undefined) {
      updates.push(`rol_id = $${paramIndex++}`);
      values.push(rol_id);
    }

    if (usuario !== undefined) {
      updates.push(`usuario = $${paramIndex++}`);
      values.push(usuario);
    }

    // 🔥 CRÍTICO: Diferenciar entre contraseña plana y pre-hasheada
    if (contrasena_hasheada !== undefined) {
      // Si viene contrasena_hasheada, usarla directamente (ya está hasheada)
      console.log('🔐 Usando contraseña pre-hasheada desde microservicio MFA');
      updates.push(`contrasena = $${paramIndex++}`);
      values.push(contrasena_hasheada);
    } else if (contrasena !== undefined) {
      // Si viene contrasena normal, hashearla
      console.log('🔐 Hasheando contraseña nueva');
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

    // ✅ CRÍTICO: Permitir actualizar es_temporal
    if (es_temporal !== undefined) {
      updates.push(`es_temporal = $${paramIndex++}`);
      values.push(es_temporal);
    }

    if (updates.length === 0) {
      const query = `SELECT * FROM usuario WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);

    const query = `
      UPDATE usuario 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    console.log('📄 Update query:', query);
    console.log('🔢 Update values:', values.map((v, i) => 
      i === values.findIndex(val => val === userData.contrasena_hasheada) 
        ? '[HASH OCULTO]' 
        : v
    ));

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

  // 🔥 MÉTODO ESPECÍFICO para cambio de contraseña temporal
  // Este método ya recibe el hash correcto y no lo vuelve a hashear
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
      console.log('🔐 Guardando nuevo hash de contraseña...');
      const result = await pool.query(query, [newPasswordHash, userId]);
      console.log('✅ Hash guardado correctamente');
      return result.rows[0];
    } catch (error) {
      console.error('Error changing temporary password:', error);
      throw error;
    }
  }
}

module.exports = User;