import { BaseModel } from './base.model.js';
import type { Department, DepartmentWithHeadcount, QueryParam } from '../types/index.js';

const DEPARTMENT_COLUMNS = ['id', 'department_id', 'name'];

export class DepartmentModel extends BaseModel<Department> {
  constructor() {
    super('departments', 'id', DEPARTMENT_COLUMNS);
  }

  /**
   * Find department by formatted department_id (e.g., 'DEP-01'), case-insensitive
   */
  async findByCode(departmentCode: string): Promise<Department | null> {
    const normalized = departmentCode.trim().toUpperCase();
    const sql = `SELECT * FROM "${this.tableName}" WHERE UPPER(department_id) = $1 LIMIT 1`;
    const rows = await this.raw<Department>(sql, [normalized as QueryParam]);
    return rows[0] ?? null;
  }

  /**
   * Find department by unique name (e.g., 'Engineering'), case-insensitive
   */
  async findByName(name: string): Promise<Department | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE LOWER(name) = LOWER($1) LIMIT 1`;
    const rows = await this.raw<Department>(sql, [name.trim() as QueryParam]);
    return rows[0] ?? null;
  }

  /**
   * Unified lookup: resolves either integer primary key (1) or department code ('DEP-01')
   */
  async findByIdOrCode(identifier: number | string): Promise<Department | null> {
    const trimmed = String(identifier).trim();
    if (/^\d+$/.test(trimmed)) {
      return this.findById(Number(trimmed));
    }
    return this.findByCode(trimmed);
  }

  /**
   * Retrieves all departments with live active employee headcounts
   */
  async getWithHeadcount(): Promise<DepartmentWithHeadcount[]> {
    const sql = `
      SELECT 
        d.id, 
        d.department_id, 
        d.name, 
        COUNT(e.id)::int AS employee_count
      FROM departments d
      LEFT JOIN roles r ON r.department_id = d.id
      LEFT JOIN employee_details e ON e.role_id = r.id AND e.status = 'ACTIVE'
      GROUP BY d.id, d.department_id, d.name
      ORDER BY d.id ASC
    `;
    return this.raw<DepartmentWithHeadcount>(sql);
  }
}

export const departmentModel = new DepartmentModel();

