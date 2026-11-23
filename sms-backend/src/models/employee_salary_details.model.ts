import { BaseModel } from './base.model.js';
import { query } from '../config/db.js';
import { departmentModel } from './departments.model.js';
import { getCycleDates } from '../utils/index.js';
import type {
  EmployeeSalaryDetail,
  CycleMetrics,
  SalaryBatchRecord,
  PoolClient,
  QueryParam,
} from '../types/index.js';

const SALARY_COLUMNS = [
  'id',
  'employee_id',
  'payout_month',
  'payout_year',
  'base_salary',
  'allowance',
  'bonus',
  'added_bonus',
  'employer_retirals',
  'gross_salary',
  'tax_deduction',
  'net_salary',
  'calculation_snapshot',
  'status',
  'paid_at',
  'created_at',
  'updated_at',
];

export class EmployeeSalaryDetailModel extends BaseModel<EmployeeSalaryDetail> {
  constructor() {
    super('employee_salary_details', 'id', SALARY_COLUMNS);
  }

  /**
   * Find specific employee's salary record for a cycle by primary employee ID
   */
  async findByEmployeeAndCycle(
    employeeId: number,
    month: number,
    year: number
  ): Promise<EmployeeSalaryDetail | null> {
    const rows = await this.find({
      employee_id: employeeId,
      payout_month: month,
      payout_year: year,
    });
    return rows[0] ?? null;
  }

  /**
   * Get cycle summary metrics (total payroll disbursed, paid vs draft counts)
   * Scoped against total eligible active employees in the cycle and optional department
   */
  async getCycleMetrics(
    month: number = 11,
    year: number = 2026,
    departmentId?: string | number
  ): Promise<CycleMetrics> {
    const { cycleStart, cycleEnd } = getCycleDates(month, year);

    // Resolve department filter if provided
    let deptIdFilter: number | null = null;
    if (departmentId !== undefined && departmentId !== null && String(departmentId).trim() !== '') {
      const dept = await departmentModel.findByIdOrCode(departmentId);
      if (dept) {
        deptIdFilter = dept.id;
      } else {
        // Filter specified a department that doesn't exist
        return {
          total_eligible: 0,
          total_records: 0,
          draft_count: 0,
          paid_count: 0,
          total_gross: 0,
          total_net: 0,
          status: 'EMPTY',
          bonus_recipients: [],
        };
      }
    }

    // 1. Calculate total eligible active employees for this period (and optional department)
    const eligibleParams: QueryParam[] = [cycleStart, cycleEnd];
    let eligibleDeptFilter = '';
    if (deptIdFilter !== null) {
      eligibleParams.push(deptIdFilter);
      eligibleDeptFilter = `AND r.department_id = $3`;
    }

    const eligibleSql = `
      SELECT COUNT(e.id)::int AS total_eligible
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE e.date_of_joining <= $2
        AND (e.last_working_day IS NULL OR e.last_working_day >= $1)
        AND e.status = 'ACTIVE'
        ${eligibleDeptFilter}
    `;
    const eligibleRes = await query<{ total_eligible: number }>(eligibleSql, eligibleParams);
    const totalEligible = Number(eligibleRes.rows[0]?.total_eligible || 0);

    // 2. Query existing salary records for this period (and optional department)
    const salaryParams: QueryParam[] = [month, year];
    let salaryDeptFilter = '';
    if (deptIdFilter !== null) {
      salaryParams.push(deptIdFilter);
      salaryDeptFilter = `AND r.department_id = $3`;
    }

    const sql = `
      SELECT 
        COUNT(s.id)::int AS total_records,
        COUNT(CASE WHEN s.status = 'DRAFT' THEN 1 END)::int AS draft_count,
        COUNT(CASE WHEN s.status = 'PAID' THEN 1 END)::int AS paid_count,
        COALESCE(SUM(s.gross_salary), 0)::float AS total_gross,
        COALESCE(SUM(s.net_salary), 0)::float AS total_net
      FROM employee_salary_details s
      JOIN employee_details e ON s.employee_id = e.id
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE s.payout_month = $1 AND s.payout_year = $2
        AND e.status = 'ACTIVE'
        ${salaryDeptFilter}
    `;
    const res = await query<{
      total_records: number;
      draft_count: number;
      paid_count: number;
      total_gross: number;
      total_net: number;
    }>(sql, salaryParams);
    const row = res.rows[0];

    // 3. Query draft employees with manual added bonuses in this scope
    const bonusSql = `
      SELECT e.employee_id, s.added_bonus::float
      FROM employee_salary_details s
      JOIN employee_details e ON s.employee_id = e.id
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE s.payout_month = $1 AND s.payout_year = $2 
        AND s.added_bonus > 0 AND s.status = 'DRAFT'
        ${salaryDeptFilter}
      ORDER BY e.employee_id ASC
    `;
    const bonusRes = await query<{ employee_id: string; added_bonus: number }>(bonusSql, salaryParams);
    const bonusRecipients = bonusRes.rows.map((r) => ({
      employee_id: String(r.employee_id),
      added_bonus: Number(r.added_bonus),
    }));

    let status: 'DRAFT' | 'PAID' | 'PARTIAL' | 'MIXED' | 'EMPTY' = 'EMPTY';
    if (row.total_records > 0) {
      if (totalEligible > 0 && row.paid_count >= totalEligible && row.draft_count === 0) {
        status = 'PAID';
      } else if (row.paid_count > 0) {
        status = 'PARTIAL';
      } else if (row.draft_count > 0) {
        status = 'DRAFT';
      } else {
        status = 'MIXED';
      }
    }

    return {
      total_eligible: totalEligible,
      total_records: row.total_records,
      draft_count: row.draft_count,
      paid_count: row.paid_count,
      total_gross: Number(row.total_gross.toFixed(2)),
      total_net: Number(row.total_net.toFixed(2)),
      status,
      bonus_recipients: bonusRecipients,
    };
  }

  /**
   * Mark all records for a cycle as PAID & locked (Payday Event)
   */
  async disburseCycle(month: number, year: number, dbClient?: PoolClient): Promise<number> {
    const sql = `
      UPDATE employee_salary_details
      SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
      WHERE payout_month = $1 AND payout_year = $2 AND status = 'DRAFT'
      RETURNING id
    `;
    const res = dbClient
      ? await dbClient.query<{ id: number }>(sql, [month as QueryParam, year as QueryParam])
      : await query<{ id: number }>(sql, [month as QueryParam, year as QueryParam]);
    return res.rows.length;
  }

  /**
   * Mark an individual employee's record as PAID & locked (Exit / FnF Settlement)
   */
  async disburseIndividual(
    employeeId: number,
    month: number,
    year: number,
    dbClient?: PoolClient
  ): Promise<EmployeeSalaryDetail | null> {
    const sql = `
      UPDATE employee_salary_details
      SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
      WHERE employee_id = $1 AND payout_month = $2 AND payout_year = $3 AND status = 'DRAFT'
      RETURNING *
    `;
    const res = dbClient
      ? await dbClient.query<EmployeeSalaryDetail>(sql, [
          employeeId as QueryParam,
          month as QueryParam,
          year as QueryParam,
        ])
      : await query<EmployeeSalaryDetail>(sql, [
          employeeId as QueryParam,
          month as QueryParam,
          year as QueryParam,
        ]);
    return res.rows[0] ?? null;
  }

  /**
   * High-performance batch upsert for a chunk of calculated salary records
   * inside an ACID database transaction.
   * Enforces Idempotency: ON CONFLICT DO UPDATE WHERE status = 'DRAFT'
   */
  async batchUpsertChunk(
    dbClient: PoolClient,
    records: SalaryBatchRecord[]
  ): Promise<number> {
    if (records.length === 0) return 0;

    const values: QueryParam[] = [];
    const valuePlaceholders: string[] = [];
    let idx = 1;

    for (const r of records) {
      valuePlaceholders.push(
        `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10}, $${idx + 11}, $${idx + 12})`
      );
      values.push(
        r.employee_id,
        r.payout_month,
        r.payout_year,
        r.base_salary,
        r.allowance,
        r.bonus,
        r.added_bonus || 0,
        r.employer_retirals,
        r.gross_salary,
        r.tax_deduction,
        r.net_salary,
        JSON.stringify(r.calculation_snapshot),
        r.status
      );
      idx += 13;
    }

    const sql = `
      INSERT INTO employee_salary_details (
        employee_id,
        payout_month,
        payout_year,
        base_salary,
        allowance,
        bonus,
        added_bonus,
        employer_retirals,
        gross_salary,
        tax_deduction,
        net_salary,
        calculation_snapshot,
        status
      )
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (employee_id, payout_year, payout_month)
      DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        allowance = EXCLUDED.allowance,
        bonus = EXCLUDED.bonus,
        added_bonus = EXCLUDED.added_bonus,
        employer_retirals = EXCLUDED.employer_retirals,
        gross_salary = EXCLUDED.gross_salary,
        tax_deduction = EXCLUDED.tax_deduction,
        net_salary = EXCLUDED.net_salary,
        calculation_snapshot = EXCLUDED.calculation_snapshot,
        updated_at = NOW()
      WHERE employee_salary_details.status = 'DRAFT'
    `;

    const res = await dbClient.query(sql, values);
    return res.rowCount || 0;
  }
}

export const employeeSalaryDetailModel = new EmployeeSalaryDetailModel();

