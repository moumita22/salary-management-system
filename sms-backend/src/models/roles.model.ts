import { BaseModel } from './base.model.js';
import { departmentModel } from './departments.model.js';
import type { Role, SeniorityLevel } from '../types/index.js';

const ROLE_COLUMNS = ['id', 'department_id', 'title', 'level'];

export class RoleModel extends BaseModel<Role> {
  constructor() {
    super('roles', 'id', ROLE_COLUMNS);
  }

  /**
   * Find a role by primary key ID, with joined department name and code
   */
  override async findById(id: number | string): Promise<Role | null> {
    const sql = `
      SELECT 
        r.id, 
        r.department_id, 
        r.title, 
        r.level, 
        d.name AS department_name,
        d.department_id AS department_code
      FROM roles r
      JOIN departments d ON r.department_id = d.id
      WHERE r.id = $1
      LIMIT 1
    `;
    const rows = await this.raw<Role>(sql, [Number(id)]);
    return rows[0] ?? null;
  }

  /**
   * Find roles for a department (accepts either integer PK or department code like 'DEP-01')
   */
  async findByDepartment(departmentIdentifier: number | string): Promise<Role[]> {
    const dept = await departmentModel.findByIdOrCode(departmentIdentifier);
    if (!dept) {
      return [];
    }

    const sql = `
      SELECT 
        r.id, 
        r.department_id, 
        r.title, 
        r.level, 
        d.name AS department_name,
        d.department_id AS department_code
      FROM roles r
      JOIN departments d ON r.department_id = d.id
      WHERE r.department_id = $1
      ORDER BY r.id ASC
    `;
    return this.raw<Role>(sql, [dept.id]);
  }

  /**
   * Find all roles with department name and code joined
   */
  async findAllWithDepartment(): Promise<Role[]> {
    const sql = `
      SELECT 
        r.id, 
        r.department_id, 
        r.title, 
        r.level, 
        d.name AS department_name,
        d.department_id AS department_code
      FROM roles r
      JOIN departments d ON r.department_id = d.id
      ORDER BY r.department_id ASC, r.id ASC
    `;
    return this.raw<Role>(sql);
  }

  /**
   * Find role by natural composite key (department, title, level)
   */
  async findByTitleAndLevel(
    departmentId: number,
    title: string,
    level: SeniorityLevel
  ): Promise<Role | null> {
    const sql = `
      SELECT 
        r.id, 
        r.department_id, 
        r.title, 
        r.level, 
        d.name AS department_name,
        d.department_id AS department_code
      FROM roles r
      JOIN departments d ON r.department_id = d.id
      WHERE r.department_id = $1 AND LOWER(r.title) = LOWER($2) AND r.level = $3
      LIMIT 1
    `;
    const rows = await this.raw<Role>(sql, [departmentId, title.trim(), level]);
    return rows[0] ?? null;
  }
}

export const roleModel = new RoleModel();
