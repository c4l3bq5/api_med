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

  static async update(id, userData) {
    const updates = [];
    const values = [];
    let paramCounter = 1;

    // Solo actualizar los campos que se proporcionen
    if (userData.rol_id !== undefined) {
      updates.push(`rol_id = ${paramCounter++}`);
      values.push(userData.rol_id);
    }
    if (userData.usuario !== undefined) {
      updates.push(`usuario = ${paramCounter++}`);
      values.push(userData.usuario);
    }
    if (userData.contrasena) {
      const hashedContrasena = await bcrypt.hash(userData.contrasena, 12);
      updates.push(`contrasena = ${paramCounter++}`);
      values.push(hashedContrasena);
    }
    if (userData.mfa_secreto !== undefined) {
      updates.push(`mfa_secreto = ${paramCounter++}`);
      values.push(userData.mfa_secreto);
    }
    if (userData.mfa_activo !== undefined) {
      updates.push(`mfa_activo = ${paramCounter++}`);
      values.push(userData.mfa_activo);
    }
    if (userData.activo !== undefined) {
      updates.push(`activo = ${paramCounter++}`);
      values.push(userData.activo);
    }

    // Si no hay campos para actualizar, retornar el usuario existente
    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id); // Agregar el ID al final para el WHERE

    const query = `
      UPDATE usuario 
      SET ${updates.join(', ')}
      WHERE id = ${paramCounter}
      RETURNING *
    `;

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
}

module.exports = User;