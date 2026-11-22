import { BaseModel } from './base.model.js';
import type { Role } from '../types/index.js';

const ROLE_COLUMNS = ['id', 'department_id', 'title', 'level'];

export class RoleModel extends BaseModel<Role> {
  constructor() {
    super('roles', 'id', ROLE_COLUMNS);
  }

  /**
   * Find roles for a department, joining department details
   */
  async findByDepartment(departmentId: number): Promise<Role[]> {
    const sql = `
      SELECT r.id, r.department_id, r.title, r.level, d.name AS department_name
      FROM roles r
      JOIN departments d ON r.department_id = d.id
      WHERE r.department_id = $1
      ORDER BY r.id ASC
    `;
    return this.raw<Role>(sql, [departmentId]);
  }

  /**
   * Find all roles with department name joined
   */
  async findAllWithDepartment(): Promise<Role[]> {
    const sql = `
      SELECT r.id, r.department_id, r.title, r.level, d.name AS department_name
      FROM roles r
      JOIN departments d ON r.department_id = d.id
      ORDER BY r.department_id ASC, r.id ASC
    `;
    return this.raw<Role>(sql);
  }
}

export const roleModel = new RoleModel();
