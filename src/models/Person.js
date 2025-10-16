const pool = require('../config/database');

class Person {
  static async findAll(active = true) {
    const query = `
      SELECT * FROM persona 
      WHERE activo = $1 
      ORDER BY id DESC
    `;
    const result = await pool.query(query, [active ? 'activo' : 'inactivo']);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM persona WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByCI(ci) {
    const query = 'SELECT * FROM persona WHERE ci = $1';
    const result = await pool.query(query, [ci]);
    return result.rows[0];
  }

  static async findByEmail(mail) {
    const query = 'SELECT * FROM persona WHERE mail = $1';
    const result = await pool.query(query, [mail]);
    return result.rows[0];
  }

  static async create(personData) {
    const {
      nombre,
      a_paterno,
      a_materno,
      fech_nac,
      telefono,
      mail,
      ci,
      genero,
      domicilio
    } = personData;

    const query = `
      INSERT INTO persona 
      (nombre, a_paterno, a_materno, fech_nac, telefono, mail, ci, genero, domicilio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      nombre,
      a_paterno,
      a_materno,
      fech_nac,
      telefono,
      mail,
      ci,
      genero,
      domicilio
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, personData) {
    const {
      nombre,
      a_paterno,
      a_materno,
      fech_nac,
      telefono,
      mail,
      ci,
      genero,
      domicilio,
      activo
    } = personData;

    const query = `
      UPDATE persona 
      SET nombre = $1, a_paterno = $2, a_materno = $3, fech_nac = $4, 
          telefono = $5, mail = $6, ci = $7, genero = $8, domicilio = $9, activo = $10
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      nombre,
      a_paterno,
      a_materno,
      fech_nac,
      telefono,
      mail,
      ci,
      genero,
      domicilio,
      activo,
      id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      UPDATE persona 
      SET activo = 'inactivo' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async activate(id) {
    const query = `
      UPDATE persona 
      SET activo = 'activo' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async search(searchTerm) {
    const query = `
      SELECT * FROM persona 
      WHERE (nombre ILIKE $1 OR a_paterno ILIKE $1 OR a_materno ILIKE $1)
        AND activo = 'activo'
      ORDER BY nombre
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

module.exports = Person;