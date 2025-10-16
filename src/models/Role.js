const pool = require('../config/database');

class Role {
  static async findAll(active = true) {
    const query = `
      SELECT * FROM roles 
      ${active ? 'WHERE id IN (1, 2, 3)' : ''} 
      ORDER BY id
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM roles WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByName(nombre) {
    const query = 'SELECT * FROM roles WHERE nombre = $1';
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  }

  static async create(roleData) {
    const { nombre } = roleData;

    const query = `
      INSERT INTO roles (nombre)
      VALUES ($1)
      RETURNING *
    `;

    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  }

  static async update(id, roleData) {
    const { nombre } = roleData;

    const query = `
      UPDATE roles 
      SET nombre = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [nombre, id]);
    return result.rows[0];
  }

  // Para roles predefinidos, no permitimos eliminación física
  static async canDelete(id) {
    // No permitir eliminar roles del sistema (1, 2, 3)
    return ![1, 2, 3].includes(parseInt(id));
  }

  static async initializeDefaultRoles() {
    const defaultRoles = [
      { id: 1, nombre: 'medico' },
      { id: 2, nombre: 'interno' },
      { id: 3, nombre: 'administrador' }
    ];

    for (const role of defaultRoles) {
      const existingRole = await this.findById(role.id);
      if (!existingRole) {
        await this.create({ nombre: role.nombre });
        console.log(` Rol creado: ${role.nombre}`);
      }
    }
  }
}

module.exports = Role;