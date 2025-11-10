const pool = require('../config/database');

class MedicalHistory {
  // NUEVO: Generar ID personalizado basado en paciente
  static async generateCustomId(paciente_id) {
    // Formatear paciente_id con padding (ej: 1 -> "01", 20 -> "20")
    const patientIdStr = String(paciente_id).padStart(2, '0');
    
    // Buscar el último historial de este paciente
    const query = `
      SELECT id FROM historial_clinico 
      WHERE id LIKE $1
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query, [`${patientIdStr}%`]);
    
    let historyNumber = 1;
    if (result.rows.length > 0) {
      const lastId = result.rows[0].id;
      // Extraer el número de historial (últimos 2 dígitos)
      const lastNumber = parseInt(lastId.substring(2));
      historyNumber = lastNumber + 1;
    }
    
    // Formatear número de historial con padding (ej: 1 -> "01", 10 -> "10")
    const historyNumberStr = String(historyNumber).padStart(2, '0');
    
    // Retornar ID personalizado (ej: "0103")
    return `${patientIdStr}${historyNumberStr}`;
  }

  static async findAll(active = true) {
    const query = `
      SELECT h.*, 
             u.usuario as medico_usuario,
             p_med.nombre as medico_nombre, p_med.a_paterno as medico_a_paterno,
             p_pac.nombre as paciente_nombre, p_pac.a_paterno as paciente_a_paterno, p_pac.ci as paciente_ci
      FROM historial_clinico h
      JOIN usuario u ON h.usuario_id = u.id
      JOIN persona p_med ON u.persona_id = p_med.id
      JOIN paciente pac ON h.paciente_id = pac.id
      JOIN persona p_pac ON pac.persona_id = p_pac.id
      WHERE h.activo = $1
      ORDER BY h.id DESC
    `;
    const result = await pool.query(query, [active ? 'activo' : 'inactivo']);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT h.*, 
             u.usuario as medico_usuario, u.id as medico_id,
             p_med.nombre as medico_nombre, p_med.a_paterno as medico_a_paterno, p_med.a_materno as medico_a_materno,
             pac.id as paciente_id, p_pac.nombre as paciente_nombre, p_pac.a_paterno as paciente_a_paterno, 
             p_pac.a_materno as paciente_a_materno, p_pac.ci as paciente_ci, p_pac.fech_nac as paciente_fech_nac
      FROM historial_clinico h
      JOIN usuario u ON h.usuario_id = u.id
      JOIN persona p_med ON u.persona_id = p_med.id
      JOIN paciente pac ON h.paciente_id = pac.id
      JOIN persona p_pac ON pac.persona_id = p_pac.id
      WHERE h.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByPatientId(paciente_id) {
    const query = `
      SELECT h.*, 
             u.usuario as medico_usuario,
             p_med.nombre as medico_nombre, p_med.a_paterno as medico_a_paterno
      FROM historial_clinico h
      JOIN usuario u ON h.usuario_id = u.id
      JOIN persona p_med ON u.persona_id = p_med.id
      WHERE h.paciente_id = $1 AND h.activo = 'activo'
      ORDER BY h.id DESC
    `;
    const result = await pool.query(query, [paciente_id]);
    return result.rows;
  }

  static async findByDoctorId(usuario_id) {
    const query = `
      SELECT h.*, 
             p_pac.nombre as paciente_nombre, p_pac.a_paterno as paciente_a_paterno, p_pac.ci as paciente_ci
      FROM historial_clinico h
      JOIN paciente pac ON h.paciente_id = pac.id
      JOIN persona p_pac ON pac.persona_id = p_pac.id
      WHERE h.usuario_id = $1 AND h.activo = 'activo'
      ORDER BY h.id DESC
    `;
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  }

  static async create(medicalHistoryData) {
    const {
      id, // NUEVO: Ahora se recibe el ID generado
      usuario_id,
      paciente_id,
      diagnostico,
      tratamiento,
      foto_analizada,
      avance
    } = medicalHistoryData;

    const query = `
      INSERT INTO historial_clinico 
      (id, usuario_id, paciente_id, diagnostico, tratamiento, foto_analizada, avance)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      id, // ID personalizado
      usuario_id,
      paciente_id,
      diagnostico,
      tratamiento,
      foto_analizada,
      avance
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, medicalHistoryData) {
    const {
      diagnostico,
      tratamiento,
      foto_analizada,
      avance,
      activo
    } = medicalHistoryData;

    const query = `
      UPDATE historial_clinico 
      SET diagnostico = $1, tratamiento = $2, foto_analizada = $3, avance = $4, activo = $5
      WHERE id = $6
      RETURNING *
    `;

    const values = [
      diagnostico,
      tratamiento,
      foto_analizada,
      avance,
      activo || 'activo',
      id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      UPDATE historial_clinico 
      SET activo = 'inactivo' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Estadísticas
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_historias,
        COUNT(CASE WHEN activo = 'activo' THEN 1 END) as activas,
        COUNT(DISTINCT paciente_id) as pacientes_atendidos,
        COUNT(DISTINCT usuario_id) as medicos_activos
      FROM historial_clinico
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Historial por paciente con paginación
  static async getByPatientWithPagination(paciente_id, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT h.*, 
             u.usuario as medico_usuario,
             p_med.nombre as medico_nombre, p_med.a_paterno as medico_a_paterno
      FROM historial_clinico h
      JOIN usuario u ON h.usuario_id = u.id
      JOIN persona p_med ON u.persona_id = p_med.id
      WHERE h.paciente_id = $1 AND h.activo = 'activo'
      ORDER BY h.id DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM historial_clinico 
      WHERE paciente_id = $1 AND activo = 'activo'
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, [paciente_id, limit, offset]),
      pool.query(countQuery, [paciente_id])
    ]);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  }
}

module.exports = MedicalHistory;