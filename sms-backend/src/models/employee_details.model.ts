import { BaseModel, PaginationResult } from './base.model.js';
import { query } from '../config/db.js';
import { departmentModel } from './departments.model.js';
import { getCycleDates } from '../utils/index.js';
import type { EmployeeDetail, DirectoryEmployee, QueryParam } from '../types/index.js';

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
  'updated_at',
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
  ignoreCycleDates?: boolean;
}

export class EmployeeDetailModel extends BaseModel<EmployeeDetail> {
  constructor() {
    super('employee_details', 'id', EMPLOYEE_COLUMNS);
  }

  /**
   * Find employee by formatted employee_id (e.g., 'EMP-0001'), case-insensitive
   */
  async findByEmployeeCode(employeeCode: string): Promise<EmployeeDetail | null> {
    const normalized = employeeCode.trim().toUpperCase();
    const sql = `SELECT * FROM "${this.tableName}" WHERE UPPER(employee_id) = $1 LIMIT 1`;
    const rows = await this.raw<EmployeeDetail>(sql, [normalized as QueryParam]);
    return rows[0] ?? null;
  }

  /**
   * Find employee by email address, case-insensitive
   */
  async findByEmail(email: string): Promise<EmployeeDetail | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE LOWER(email) = LOWER($1) LIMIT 1`;
    const rows = await this.raw<EmployeeDetail>(sql, [email.trim() as QueryParam]);
    return rows[0] ?? null;
  }

  /**
   * Lookup by Primary Key (PK integer id) with joined role and department details
   */
  async findByIdWithDetails(id: number): Promise<DirectoryEmployee | null> {
    const sql = `
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
        e.created_at,
        e.updated_at,
        r.title AS role_title,
        r.level AS role_level,
        d.id AS department_pk,
        d.department_id,
        d.name AS department_name
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE e.id = $1
      LIMIT 1
    `;
    const rows = await this.raw<DirectoryEmployee>(sql, [id as QueryParam]);
    return rows[0] ?? null;
  }

  /**
   * Lookup by Unique Key (UK string employee_id e.g. 'EMP-0001') with joined role and department details
   */
  async findByCodeWithDetails(employeeCode: string): Promise<DirectoryEmployee | null> {
    const sql = `
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
        e.created_at,
        e.updated_at,
        r.title AS role_title,
        r.level AS role_level,
        d.id AS department_pk,
        d.department_id,
        d.name AS department_name
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE UPPER(e.employee_id) = UPPER($1)
      LIMIT 1
    `;
    const rows = await this.raw<DirectoryEmployee>(sql, [employeeCode.trim() as QueryParam]);
    return rows[0] ?? null;
  }

  /**
   * High-performance paginated directory search with joins across roles,
   * departments, and current month's salary details.
   */
  async findDirectoryPaginated(
    options: EmployeeDirectoryOptions = {}
  ): Promise<PaginationResult<DirectoryEmployee>> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 25)));
    const offset = (page - 1) * limit;

    const month = options.month || 11;
    const year = options.year || 2026;
    const { cycleStart, cycleEnd } = getCycleDates(month, year);

    const conditions: string[] = [];
    const values: QueryParam[] = [];
    let paramIndex = 1;

    // Employment lifecycle eligibility guard (for payroll cycles):
    if (!options.ignoreCycleDates && options.status !== 'ALL' && options.status !== 'TERMINATED') {
      // 1. Employee must have joined on or before the last day of this cycle
      conditions.push(`e.date_of_joining <= $${paramIndex}`);
      values.push(cycleEnd);
      paramIndex++;

      // 2. Employee must NOT have exited prior to the first day of this cycle
      conditions.push(`(e.last_working_day IS NULL OR e.last_working_day >= $${paramIndex})`);
      values.push(cycleStart);
      paramIndex++;
    }

    // Filter by department: Resolves UK (e.g. 'DEP-08') or ID to integer PK
    if (options.departmentId) {
      const dept = await departmentModel.findByIdOrCode(options.departmentId);
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

    // Filter by employee employment status (Defaults to 'ACTIVE' for Directory view)
    const statusFilter = options.status || 'ACTIVE';
    if (statusFilter !== 'ALL') {
      conditions.push(`e.status = $${paramIndex}`);
      values.push(statusFilter);
      paramIndex++;
    }

    // Multi-field ILIKE Search (First Name, Last Name, Full Name, Employee ID, Email)
    if (options.search && options.search.trim()) {
      const cleanSearch = options.search.trim().replace(/\s+/g, ' ');
      const term = `%${cleanSearch}%`;
      conditions.push(
        `(
          e.first_name ILIKE $${paramIndex}
          OR e.last_name ILIKE $${paramIndex}
          OR CONCAT(e.first_name, ' ', e.last_name) ILIKE $${paramIndex}
          OR CONCAT(e.last_name, ' ', e.first_name) ILIKE $${paramIndex}
          OR e.employee_id ILIKE $${paramIndex}
          OR e.email ILIKE $${paramIndex}
        )`
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
    const countRes = await query<{ total: number }>(countSql, values);
    const total = Number(countRes.rows[0]?.total || 0);

    // Sorting (Allowlisted)
    const validSortCols: Record<string, string> = {
      id: 'e.id',
      employee_id: 'e.employee_id',
      first_name: 'e.first_name',
      last_name: 'e.last_name',
      email: 'e.email',
      role_title: 'r.title',
      department_name: 'd.name',
      country_code: 'e.country_code',
      status: 'e.status',
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
        s.added_bonus,
        s.employer_retirals,
        s.gross_salary,
        s.tax_deduction,
        s.net_salary,
        s.status AS salary_status,
        s.calculation_snapshot,
        s.paid_at
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

    const dataRes = await query<DirectoryEmployee>(dataSql, [
      ...values,
      month,
      year,
      limit,
      offset,
    ]);
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
  async findExits(month: number = 11, year: number = 2026, status?: string): Promise<DirectoryEmployee[]> {
    const { cycleStart, cycleEnd } = getCycleDates(month, year);
    const params: QueryParam[] = [
      month as QueryParam,
      year as QueryParam,
      cycleStart as QueryParam,
      cycleEnd as QueryParam,
    ];
    let statusFilterClause = '';

    if (status && status !== 'ALL') {
      params.push(status.trim().toUpperCase() as QueryParam);
      statusFilterClause = `AND UPPER(e.status) = $${params.length}`;
    }

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
        e.date_of_joining,
        e.last_working_day,
        r.id AS role_id,
        r.title AS role_title,
        r.level AS role_level,
        d.id AS department_pk,
        d.department_id,
        d.name AS department_name,
        s.id AS salary_id,
        s.base_salary,
        s.allowance,
        s.bonus,
        s.added_bonus,
        s.employer_retirals,
        s.gross_salary,
        s.tax_deduction,
        s.net_salary,
        s.status AS salary_status,
        s.calculation_snapshot,
        s.paid_at
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      LEFT JOIN employee_salary_details s 
        ON s.employee_id = e.id 
        AND s.payout_month = $1 
        AND s.payout_year = $2
      WHERE e.last_working_day IS NOT NULL
        AND e.status IN ('EXITING', 'TERMINATED')
        AND e.last_working_day >= $3
        AND e.last_working_day <= $4
        ${statusFilterClause}
      ORDER BY 
        CASE WHEN e.status = 'EXITING' THEN 1 ELSE 2 END ASC,
        e.last_working_day ASC,
        e.id ASC
    `;
    return this.raw<DirectoryEmployee>(sql, params);
  }
}

export const employeeDetailModel = new EmployeeDetailModel();

