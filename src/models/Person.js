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
  // Construir dinámicamente la query basada en qué campos se envíen
  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Solo agregar campos que se envíen (no undefined)
  if (personData.nombre !== undefined) {
    updates.push(`nombre = $${paramIndex++}`);
    values.push(personData.nombre);
  }

  if (personData.a_paterno !== undefined) {
    updates.push(`a_paterno = $${paramIndex++}`);
    values.push(personData.a_paterno);
  }

  if (personData.a_materno !== undefined) {
    updates.push(`a_materno = $${paramIndex++}`);
    values.push(personData.a_materno);
  }

  if (personData.fech_nac !== undefined) {
    updates.push(`fech_nac = $${paramIndex++}`);
    values.push(personData.fech_nac);
  }

  if (personData.telefono !== undefined) {
    updates.push(`telefono = $${paramIndex++}`);
    values.push(personData.telefono);
  }

  if (personData.mail !== undefined) {
    updates.push(`mail = $${paramIndex++}`);
    values.push(personData.mail);
  }

  if (personData.ci !== undefined) {
    updates.push(`ci = $${paramIndex++}`);
    values.push(personData.ci);
  }

  if (personData.genero !== undefined) {
    updates.push(`genero = $${paramIndex++}`);
    values.push(personData.genero);
  }

  if (personData.domicilio !== undefined) {
    updates.push(`domicilio = $${paramIndex++}`);
    values.push(personData.domicilio);
  }

  if (personData.activo !== undefined) {
    updates.push(`activo = $${paramIndex++}`);
    values.push(personData.activo);
  }

  // Si no hay campos para actualizar, devolver la persona existente
  if (updates.length === 0) {
    const query = `SELECT * FROM persona WHERE id = $1`;
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

  console.log(' Person update query:', query);
  console.log(' Person update values:', values);

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