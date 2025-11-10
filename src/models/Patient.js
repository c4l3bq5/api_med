const pool = require('../config/database');

class Patient {
static async findAll(showOnlyActive = true) {
  let query = `
    SELECT p.*, 
           per.nombre, per.a_paterno, per.a_materno, per.fech_nac,
           per.telefono, per.mail, per.ci, per.genero, per.domicilio
    FROM paciente p
    JOIN persona per ON p.persona_id = per.id
  `;
  
  if (showOnlyActive) {
    query += ` WHERE p.activo = 'activo'`;
  }
  
  query += ` ORDER BY p.id DESC`;
  
  const result = await pool.query(query);
  return result.rows;
}

  static async findById(id) {
    const query = `
      SELECT p.*, 
             per.nombre, per.a_paterno, per.a_materno, per.fech_nac,
             per.telefono, per.mail, per.ci, per.genero, per.domicilio
      FROM paciente p
      JOIN persona per ON p.persona_id = per.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByPersonId(persona_id) {
    const query = `
      SELECT p.*, 
             per.nombre, per.a_paterno, per.a_materno, per.fech_nac,
             per.telefono, per.mail, per.ci, per.genero, per.domicilio
      FROM paciente p
      JOIN persona per ON p.persona_id = per.id
      WHERE p.persona_id = $1
    `;
    const result = await pool.query(query, [persona_id]);
    return result.rows[0];
  }

  static async findByCI(ci) {
    const query = `
      SELECT p.*, 
             per.nombre, per.a_paterno, per.a_materno, per.fech_nac,
             per.telefono, per.mail, per.ci, per.genero, per.domicilio
      FROM paciente p
      JOIN persona per ON p.persona_id = per.id
      WHERE per.ci = $1
    `;
    const result = await pool.query(query, [ci]);
    return result.rows[0];
  }

  static async create(patientData) {
    const {
      persona_id,
      grupo_sanguineo,
      alergias,
      antecedentes,
      estatura,
      provincia
    } = patientData;

    const query = `
      INSERT INTO paciente 
      (persona_id, grupo_sanguineo, alergias, antecedentes, estatura, provincia)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      persona_id,
      grupo_sanguineo,
      alergias,
      antecedentes,
      estatura,
      provincia
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, patientData) {
    const {
      grupo_sanguineo,
      alergias,
      antecedentes,
      estatura,
      provincia,
      activo
    } = patientData;

    const query = `
      UPDATE paciente 
      SET grupo_sanguineo = $1, alergias = $2, antecedentes = $3, 
          estatura = $4, provincia = $5, activo = $6
      WHERE id = $7
      RETURNING *
    `;

    const values = [
      grupo_sanguineo,
      alergias,
      antecedentes,
      estatura,
      provincia,
      activo,
      id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      UPDATE paciente 
      SET activo = 'inactivo' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async activate(id) {
    const query = `
      UPDATE paciente 
      SET activo = 'activo' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async search(searchTerm) {
    const query = `
      SELECT p.*, 
             per.nombre, per.a_paterno, per.a_materno, per.fech_nac,
             per.telefono, per.mail, per.ci, per.genero, per.domicilio
      FROM paciente p
      JOIN persona per ON p.persona_id = per.id
      WHERE (per.nombre ILIKE $1 OR per.a_paterno ILIKE $1 OR per.a_materno ILIKE $1 OR per.ci ILIKE $1)
        AND p.activo = 'activo'
      ORDER BY per.nombre
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }

  // Estadísticas útiles
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_pacientes,
        COUNT(CASE WHEN activo = 'activo' THEN 1 END) as activos,
        COUNT(CASE WHEN activo = 'inactivo' THEN 1 END) as inactivos,
        COUNT(DISTINCT provincia) as provincias_distintas
      FROM paciente
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Patient;