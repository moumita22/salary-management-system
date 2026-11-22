import { BaseModel } from './base.model.js';
import type { Department, DepartmentWithHeadcount } from '../types/index.js';

const DEPARTMENT_COLUMNS = ['id', 'department_id', 'name'];

export class DepartmentModel extends BaseModel<Department> {
  constructor() {
    super('departments', 'id', DEPARTMENT_COLUMNS);
  }

  /**
   * Find department by formatted department_id (e.g., 'DEP-01')
   */
  async findByCode(departmentId: string): Promise<Department | null> {
    const rows = await this.find({ department_id: departmentId });
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves all departments with live employee headcounts
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
      LEFT JOIN employee_details e ON e.role_id = r.id
      GROUP BY d.id
      ORDER BY d.id ASC
    `;
    return this.raw<DepartmentWithHeadcount>(sql);
  }
}

export const departmentModel = new DepartmentModel();
