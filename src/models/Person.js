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

  // En Person.js, reemplaza el método update():

static async update(id, personData) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Mapeo de campos que pueden actualizarse
  const allowedFields = {
    nombre: personData.nombre,
    a_paterno: personData.a_paterno,
    a_materno: personData.a_materno,
    fech_nac: personData.fech_nac,
    telefono: personData.telefono,
    mail: personData.mail,
    ci: personData.ci,
    genero: personData.genero,
    domicilio: personData.domicilio,
    activo: personData.activo
  };

  // Solo agregar campos que se envíen (no undefined)
  for (const [field, value] of Object.entries(allowedFields)) {
    if (value !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(value);
    }
  }

  // Si no hay campos para actualizar, devolver la persona existente
  if (updates.length === 0) {
    const query = 'SELECT * FROM persona WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Agregar el ID al final
  values.push(id);

  const query = `
    UPDATE persona 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

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