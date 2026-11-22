import { BaseModel } from './base.model.js';
import { query } from '../config/db.js';
import type { EmployeeSalaryDetail } from '../types/index.js';

const SALARY_COLUMNS = [
  'id',
  'employee_id',
  'payout_month',
  'payout_year',
  'base_salary',
  'allowance',
  'bonus',
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
   * Find specific employee's salary record for a cycle
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
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get cycle summary metrics (total payroll disbursed, paid vs draft counts)
   */
  async getCycleMetrics(month: number = 11, year: number = 2026): Promise<{
    total_records: number;
    draft_count: number;
    paid_count: number;
    total_gross: number;
    total_net: number;
    status: 'DRAFT' | 'PAID' | 'MIXED' | 'EMPTY';
  }> {
    const sql = `
      SELECT 
        COUNT(*)::int AS total_records,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END)::int AS draft_count,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END)::int AS paid_count,
        COALESCE(SUM(gross_salary), 0)::float AS total_gross,
        COALESCE(SUM(net_salary), 0)::float AS total_net
      FROM employee_salary_details
      WHERE payout_month = $1 AND payout_year = $2
    `;
    const res = await query(sql, [month, year]);
    const row = res.rows[0];

    let status: 'DRAFT' | 'PAID' | 'MIXED' | 'EMPTY' = 'EMPTY';
    if (row.total_records > 0) {
      if (row.draft_count === 0 && row.paid_count > 0) status = 'PAID';
      else if (row.paid_count === 0 && row.draft_count > 0) status = 'DRAFT';
      else status = 'MIXED';
    }

    return {
      total_records: row.total_records,
      draft_count: row.draft_count,
      paid_count: row.paid_count,
      total_gross: Number(row.total_gross.toFixed(2)),
      total_net: Number(row.total_net.toFixed(2)),
      status,
    };
  }

  /**
   * Mark all records for a cycle as PAID & locked (Payday Event)
   */
  async disburseCycle(month: number, year: number): Promise<number> {
    const sql = `
      UPDATE employee_salary_details
      SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
      WHERE payout_month = $1 AND payout_year = $2 AND status = 'DRAFT'
      RETURNING id
    `;
    const res = await query(sql, [month, year]);
    return res.rows.length;
  }

  /**
   * High-performance batch upsert for a chunk of calculated salary records
   * inside an ACID database transaction.
   * Enforces Idempotency (Loophole 1): ON CONFLICT DO UPDATE
   */
  async batchUpsertChunk(
    dbClient: any,
    records: Array<{
      employee_id: number;
      payout_month: number;
      payout_year: number;
      base_salary: number;
      allowance: number;
      bonus: number;
      employer_retirals: number;
      gross_salary: number;
      tax_deduction: number;
      net_salary: number;
      calculation_snapshot: any;
      status: string;
    }>
  ): Promise<number> {
    if (records.length === 0) return 0;

    const values: any[] = [];
    const valuePlaceholders: string[] = [];
    let idx = 1;

    for (const r of records) {
      valuePlaceholders.push(
        `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9}, $${idx + 10}, $${idx + 11})`
      );
      values.push(
        r.employee_id,
        r.payout_month,
        r.payout_year,
        r.base_salary,
        r.allowance,
        r.bonus,
        r.employer_retirals,
        r.gross_salary,
        r.tax_deduction,
        r.net_salary,
        JSON.stringify(r.calculation_snapshot),
        r.status
      );
      idx += 12;
    }

    const sql = `
      INSERT INTO employee_salary_details (
        employee_id,
        payout_month,
        payout_year,
        base_salary,
        allowance,
        bonus,
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
