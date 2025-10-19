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
    const {
      rol_id,
      usuario,
      contrasena,
      mfa_secreto,
      mfa_activo,
      activo
    } = userData;

    let query;
    let values;

    if (contrasena) {
      // Si hay nueva contraseña, hashearla
      const hashedContrasena = await bcrypt.hash(contrasena, 12);
      query = `
        UPDATE usuario 
        SET rol_id = $1, usuario = $2, contrasena = $3, 
            mfa_secreto = $4, mfa_activo = $5, activo = $6
        WHERE id = $7
        RETURNING *
      `;
      values = [rol_id, usuario, hashedContrasena, mfa_secreto, mfa_activo, activo, id];
    } else {
      query = `
        UPDATE usuario 
        SET rol_id = $1, usuario = $2, mfa_secreto = $3, 
            mfa_activo = $4, activo = $5
        WHERE id = $6
        RETURNING *
      `;
      values = [rol_id, usuario, mfa_secreto, mfa_activo, activo, id];
    }

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