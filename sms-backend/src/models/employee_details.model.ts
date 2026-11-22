import { BaseModel, PaginationResult } from './base.model.js';
import { query } from '../config/db.js';
import { departmentModel } from './departments.model.js';
import type { EmployeeDetail } from '../types/index.js';

const EMPLOYEE_COLUMNS = [
  'id',
  'employee_id',
  'first_name',
  'last_name',
  'email',
  'role_id',
  'country_code',
  'annual_ctc',
  'status',
  'date_of_joining',
  'last_working_day',
  'created_at',
];

export interface EmployeeDirectoryOptions {
  page?: number;
  limit?: number;
  departmentId?: string;
  countryCode?: string;
  level?: string;
  search?: string;
  status?: string;
  month?: number;
  year?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class EmployeeDetailModel extends BaseModel<EmployeeDetail> {
  constructor() {
    super('employee_details', 'id', EMPLOYEE_COLUMNS);
  }

  /**
   * High-performance paginated directory search with joins across roles,
   * departments, and current month's salary details.
   */
  async findDirectoryPaginated(
    options: EmployeeDirectoryOptions = {}
  ): Promise<PaginationResult<any>> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 25)));
    const offset = (page - 1) * limit;

    const month = options.month || 11;
    const year = options.year || 2026;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cycleStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const cycleEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Employment lifecycle eligibility guard:
    // 1. Employee must have joined on or before the last day of this cycle
    conditions.push(`e.date_of_joining <= $${paramIndex}`);
    values.push(cycleEnd);
    paramIndex++;

    // 2. Employee must NOT have exited prior to the first day of this cycle
    conditions.push(`(e.last_working_day IS NULL OR e.last_working_day >= $${paramIndex})`);
    values.push(cycleStart);
    paramIndex++;

    // Filter by department: Resolves UK (e.g. 'DEP-08') to integer PK, then filters
    if (options.departmentId) {
      const isCode = typeof options.departmentId === 'string' && options.departmentId.startsWith('DEP-');
      const dept = isCode
        ? await departmentModel.findByCode(options.departmentId)
        : await departmentModel.findById(Number(options.departmentId));

      if (dept) {
        conditions.push(`r.department_id = $${paramIndex}`);
        values.push(dept.id);
        paramIndex++;
      } else {
        conditions.push('1 = 0');
      }
    }

    // Filter by country code (e.g. 'IN')
    if (options.countryCode) {
      conditions.push(`e.country_code = $${paramIndex}`);
      values.push(options.countryCode);
      paramIndex++;
    }

    // Filter by seniority level ('JUNIOR', 'MID_LEVEL', 'SENIOR')
    if (options.level) {
      conditions.push(`r.level = $${paramIndex}`);
      values.push(options.level);
      paramIndex++;
    }

    // Filter by employee employment status ('ACTIVE', etc.)
    if (options.status) {
      conditions.push(`e.status = $${paramIndex}`);
      values.push(options.status);
      paramIndex++;
    }

    // Multi-field ILIKE Search (Name, Employee ID, Email)
    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      conditions.push(
        `(e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex})`
      );
      values.push(term);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count Query
    const countSql = `
      SELECT COUNT(e.id)::int AS total
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    // Sorting (Allowlisted)
    const validSortCols: Record<string, string> = {
      id: 'e.id',
      employee_id: 'e.employee_id',
      first_name: 'e.first_name',
      annual_ctc: 'e.annual_ctc',
      gross_salary: 's.gross_salary',
      net_salary: 's.net_salary',
      date_of_joining: 'e.date_of_joining',
    };
    const sortCol = (options.sortField && validSortCols[options.sortField]) || 'e.id';
    const sortDir = options.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Data Query joining active cycle's salary record
    const dataSql = `
      SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.role_id,
        e.country_code,
        e.annual_ctc,
        e.status,
        e.date_of_joining,
        e.last_working_day,
        r.title AS role_title,
        r.level AS role_level,
        d.id AS department_pk,
        d.department_id,
        d.name AS department_name,
        s.id AS salary_id,
        s.base_salary,
        s.allowance,
        s.bonus,
        s.employer_retirals,
        s.gross_salary,
        s.tax_deduction,
        s.net_salary,
        s.status AS salary_status,
        s.calculation_snapshot
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      LEFT JOIN employee_salary_details s 
        ON s.employee_id = e.id 
        AND s.payout_month = $${paramIndex} 
        AND s.payout_year = $${paramIndex + 1}
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
    `;

    const dataRes = await query(dataSql, [...values, month, year, limit, offset]);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Find employees resigning/exiting within a specific month and year
   */
  async findExits(month: number = 11, year: number = 2026): Promise<any[]> {
    const sql = `
      SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.annual_ctc,
        e.country_code,
        e.status,
        e.last_working_day,
        r.id AS role_id,
        r.title AS role_title,
        r.level AS role_level,
        d.name AS department_name,
        s.id AS salary_id,
        s.gross_salary,
        s.tax_deduction,
        s.net_salary,
        s.status AS salary_status,
        s.calculation_snapshot
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      LEFT JOIN employee_salary_details s 
        ON s.employee_id = e.id 
        AND s.payout_month = $1 
        AND s.payout_year = $2
      WHERE e.last_working_day IS NOT NULL
        AND EXTRACT(MONTH FROM e.last_working_day) = $1
        AND EXTRACT(YEAR FROM e.last_working_day) = $2
      ORDER BY e.last_working_day ASC
    `;
    return this.raw(sql, [month, year]);
  }
}

export const employeeDetailModel = new EmployeeDetailModel();
