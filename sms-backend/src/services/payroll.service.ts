import { pool, query } from '../config/db.js';
import { salaryCalculatorService } from './salaryCalculator.service.js';
import { employeeSalaryDetailModel } from '../models/employee_salary_details.model.js';
import { employeeDetailModel } from '../models/employee_details.model.js';
import { salaryComponentRuleModel } from '../models/salary_component_rules.model.js';
import { departmentModel } from '../models/departments.model.js';
import {
  AppError,
  type QueryParam,
  type SalaryBatchRecord,
  type EmployeeSalaryDetail,
  type SalaryComponentRule,
  type SeniorityLevel,
  type CalculationSnapshot,
} from '../types/index.js';
import { getCycleDates, type CalculatedFinancials } from '../utils/index.js';

export interface PayrollFilterOptions {
  departmentId?: string | number;
  countryCode?: string;
  level?: string;
  search?: string;
  status?: string;
}

export class PayrollService {
  /**
   * Financial Immutability Guard (Domain level, NOT Express middleware)
   * Throws 403 Forbidden if a salary record is already finalized and paid.
   */
  assertNotPaid(record: { status: string }): void {
    if (record.status === 'PAID') {
      throw new AppError(
        'Financial Immutability Violation: Payroll for this employee and period has been PAID and locked against modification.',
        403,
        'FinancialLockError'
      );
    }
  }

  /**
   * Generates or recalculates monthly payroll for all 10,000 employees.
   * Runs in an ACID Database Transaction with batch chunking of 1,000 rows.
   * Implements Idempotency (Loophole 1) via ON CONFLICT upsert.
   */
  async generateMonthlyPayroll(
    month: number = 11,
    year: number = 2026,
    filters: PayrollFilterOptions = {}
  ): Promise<{ success: boolean; generatedCount: number; durationMs: number }> {
    const startTime = Date.now();

    // 1. Guard against re-generating an already finalized/paid scope
    const metrics = await employeeSalaryDetailModel.getCycleMetrics(month, year, filters.departmentId);
    if (metrics.status === 'PAID') {
      const scopeLabel = filters.departmentId ? 'for this department' : `for ${month}/${year}`;
      throw new AppError(
        `Payroll ${scopeLabel} is finalized and locked (status: PAID). Cannot re-generate.`,
        403,
        'FinancialLockError'
      );
    }

    // 2. Load all policy rules with native float percentages into an in-memory lookup map: `${role_id}_${country_code}`
    const rulesList = await salaryComponentRuleModel.findAllWithDetails();
    const rulesMap = new Map<string, SalaryComponentRule>();
    for (const rule of rulesList) {
      rulesMap.set(`${rule.role_id}_${rule.country_code}`, rule);
    }

    // 3. Load all eligible employees active during this cycle (with optional scoping filters)
    const { cycleStart, cycleEnd, daysInMonth } = getCycleDates(month, year);

    const conditions: string[] = [
      'e.date_of_joining <= $2',
      '(e.last_working_day IS NULL OR e.last_working_day >= $1)',
      "e.status = 'ACTIVE'",
    ];
    const values: QueryParam[] = [cycleStart, cycleEnd];
    let pIdx = 3;

    if (filters.departmentId) {
      const dept = await departmentModel.findByIdOrCode(filters.departmentId);
      if (dept) {
        conditions.push(`r.department_id = $${pIdx++}`);
        values.push(dept.id);
      } else {
        conditions.push('1 = 0');
      }
    }

    if (filters.countryCode) {
      conditions.push(`e.country_code = $${pIdx++}`);
      values.push(filters.countryCode);
    }

    if (filters.level) {
      conditions.push(`r.level = $${pIdx++}`);
      values.push(filters.level);
    }

    if (filters.search && filters.search.trim()) {
      const cleanSearch = filters.search.trim().replace(/\s+/g, ' ');
      conditions.push(
        `(
          e.first_name ILIKE $${pIdx}
          OR e.last_name ILIKE $${pIdx}
          OR CONCAT(e.first_name, ' ', e.last_name) ILIKE $${pIdx}
          OR CONCAT(e.last_name, ' ', e.first_name) ILIKE $${pIdx}
          OR e.employee_id ILIKE $${pIdx}
          OR e.email ILIKE $${pIdx}
        )`
      );
      values.push(`%${cleanSearch}%`);
      pIdx++;
    }

    interface PayrollGenerationEmployeeRow {
      id: number;
      employee_id: string;
      role_id: number;
      country_code: string;
      annual_ctc: number | string;
      date_of_joining: string;
      last_working_day?: string | null;
      role_title: string;
      role_level: SeniorityLevel;
      department_name: string;
    }

    const employeesSql = `
      SELECT 
        e.id, 
        e.employee_id, 
        e.role_id, 
        e.country_code, 
        e.annual_ctc, 
        e.date_of_joining,
        e.last_working_day,
        r.title AS role_title,
        r.level AS role_level,
        d.name AS department_name
      FROM employee_details e
      JOIN roles r ON e.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.id ASC
    `;
    const employeesRes = await query<PayrollGenerationEmployeeRow>(employeesSql, values);
    const employees = employeesRes.rows;

    // 4. Query existing draft added_bonus adjustments to preserve manual spot bonuses
    interface ExistingDraftAdjustmentRow {
      employee_id: number;
      added_bonus: number | string;
      calculation_snapshot: { overrides_applied?: { modified_at: string; customAdditions: Array<{ name: string; amount: number }> } } | null;
    }

    const existingAdjustmentsRes = await query<ExistingDraftAdjustmentRow>(
      `SELECT employee_id, added_bonus, calculation_snapshot
       FROM employee_salary_details
       WHERE payout_month = $1 AND payout_year = $2 AND status = 'DRAFT' AND added_bonus > 0`,
      [month, year]
    );
    const preservedBonusMap = new Map<
      number,
      {
        added_bonus: number;
        overrides: { modified_at: string; customAdditions: Array<{ name: string; amount: number }> } | null;
      }
    >();
    for (const row of existingAdjustmentsRes.rows) {
      preservedBonusMap.set(Number(row.employee_id), {
        added_bonus: Number(row.added_bonus) || 0,
        overrides: row.calculation_snapshot?.overrides_applied || null,
      });
    }

    // 5. Transform and calculate each employee's salary breakdown in memory using Integer Cents
    const calculatedRows: SalaryBatchRecord[] = [];
    for (const emp of employees) {
      const rule = rulesMap.get(`${emp.role_id}_${emp.country_code}`);
      if (!rule) {
        throw new Error(
          `Missing policy rule for Role ID ${emp.role_id} and Country '${emp.country_code}' (Employee: ${emp.employee_id})`
        );
      }

      // Check if mid-month exit in this cycle
      const isExitThisMonth =
        Boolean(emp.last_working_day) &&
        new Date(String(emp.last_working_day)).getMonth() + 1 === month &&
        new Date(String(emp.last_working_day)).getFullYear() === year;

      // Check if mid-month joining in this cycle
      const joinDate = new Date(String(emp.date_of_joining));
      const isJoinThisMonth =
        joinDate.getMonth() + 1 === month &&
        joinDate.getFullYear() === year &&
        joinDate.getDate() > 1;

      let financials: CalculatedFinancials;
      let prorationMeta:
        | { is_prorated: boolean; total_working_days: number; actual_days_worked: number }
        | undefined = undefined;

      if (isExitThisMonth) {
        const exitFinancials = salaryCalculatorService.calculateProratedSettlement(
          Number(emp.annual_ctc),
          rule,
          month,
          year,
          String(emp.last_working_day)
        );
        financials = exitFinancials;
        prorationMeta = {
          is_prorated: true,
          total_working_days: exitFinancials.total_working_days,
          actual_days_worked: exitFinancials.actual_days_worked,
        };
      } else if (isJoinThisMonth) {
        const joinFinancials = salaryCalculatorService.calculateMidMonthJoinProration(
          Number(emp.annual_ctc),
          rule,
          month,
          year,
          String(emp.date_of_joining)
        );
        financials = joinFinancials;
        prorationMeta = {
          is_prorated: true,
          total_working_days: joinFinancials.total_working_days,
          actual_days_worked: joinFinancials.actual_days_worked,
        };
      } else {
        financials = salaryCalculatorService.calculateMonthlySalary(
          Number(emp.annual_ctc),
          rule
        );
      }

      // Check if this employee has an existing manual added_bonus to preserve
      const preserved = preservedBonusMap.get(Number(emp.id));
      const addedBonus = preserved ? preserved.added_bonus : 0;

      let finalGross = financials.gross_salary;
      let finalTax = financials.tax_deduction;
      let finalNet = financials.net_salary;

      if (addedBonus > 0) {
        finalGross = Number(
          (financials.base_salary + financials.allowance + financials.bonus + addedBonus).toFixed(2)
        );
        const deductionPct = Number(rule.deduction_percentage) || 12;
        finalTax = Number((finalGross * (deductionPct / 100)).toFixed(2));
        finalNet = Number((finalGross - finalTax).toFixed(2));
      }

      const snapshot = salaryCalculatorService.buildSnapshot(
        financials,
        rule,
        {
          role_title: emp.role_title,
          role_level: emp.role_level,
          country_code: emp.country_code,
          department_name: emp.department_name,
        },
        prorationMeta
      );

      if (addedBonus > 0) {
        snapshot.overrides_applied = preserved?.overrides || {
          modified_at: new Date().toISOString(),
          customAdditions: [{ name: 'Added Bonus', amount: addedBonus }],
        };
      }

      calculatedRows.push({
        employee_id: emp.id,
        payout_month: month,
        payout_year: year,
        base_salary: financials.base_salary,
        allowance: financials.allowance,
        bonus: financials.bonus,
        added_bonus: addedBonus,
        employer_retirals: financials.employer_retirals,
        gross_salary: finalGross,
        tax_deduction: finalTax,
        net_salary: finalNet,
        calculation_snapshot: snapshot,
        status: 'DRAFT',
      });
    }

    // 6. ACID Database Transaction with batch chunking (1,000 rows per batch)
    const client = await pool.connect();
    let totalInserted = 0;
    const CHUNK_SIZE = 1000;

    try {
      await client.query('BEGIN');

      for (let i = 0; i < calculatedRows.length; i += CHUNK_SIZE) {
        const chunk = calculatedRows.slice(i, i + CHUNK_SIZE);
        const count = await employeeSalaryDetailModel.batchUpsertChunk(client, chunk);
        totalInserted += count;
      }

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    const durationMs = Date.now() - startTime;
    return {
      success: true,
      generatedCount: totalInserted,
      durationMs,
    };
  }

  /**
   * Adjust/Override components for an individual employee (with financial lock check)
   */
  async adjustEmployeeSalary(
    employeeId: number,
    month: number,
    year: number,
    customAdditions: Array<{ name: string; amount: number }> = [],
    overrides?: {
      base_salary?: number;
      allowance?: number;
      bonus?: number;
      tax_deduction?: number;
    }
  ): Promise<EmployeeSalaryDetail> {
    const existing = await employeeSalaryDetailModel.findByEmployeeAndCycle(
      employeeId,
      month,
      year
    );

    if (!existing) {
      throw new AppError(
        `No salary draft found for employee ID ${employeeId} in ${month}/${year}. Generate payroll first.`,
        404
      );
    }

    // Financial Immutability Guard
    this.assertNotPaid(existing);

    const baseSalary = overrides?.base_salary !== undefined ? overrides.base_salary : Number(existing.base_salary);
    const allowance = overrides?.allowance !== undefined ? overrides.allowance : Number(existing.allowance);
    const bonus = overrides?.bonus !== undefined ? overrides.bonus : Number(existing.bonus);

    const customTotal = customAdditions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const deductionPct = existing.calculation_snapshot?.deduction_percentage || 12;

    const recalculated = salaryCalculatorService.recalculateOverride(
      baseSalary,
      allowance,
      bonus,
      deductionPct,
      customTotal
    );

    const updatedSnapshot: CalculationSnapshot & { overrides_applied?: Record<string, unknown> } = {
      ...existing.calculation_snapshot,
    };
    if (customAdditions.length > 0) {
      updatedSnapshot.overrides_applied = {
        modified_at: new Date().toISOString(),
        customAdditions,
      };
    } else {
      delete updatedSnapshot.overrides_applied;
    }

    const updated = await employeeSalaryDetailModel.update(existing.id, {
      base_salary: recalculated.base_salary,
      allowance: recalculated.allowance,
      bonus: recalculated.bonus,
      added_bonus: recalculated.added_bonus,
      gross_salary: recalculated.gross_salary,
      tax_deduction: recalculated.tax_deduction,
      net_salary: recalculated.net_salary,
      calculation_snapshot: updatedSnapshot,
      updated_at: Date.now(),
    });

    if (!updated) {
      throw new AppError('Failed to update employee salary record', 500);
    }

    return updated;
  }

  /**
   * Disburse & Lock Payroll (Month-End Payday event)
   * Also transitions any disbursed exiting employees to TERMINATED
   */
  async disbursePayroll(
    month: number = 11,
    year: number = 2026
  ): Promise<{ success: boolean; lockedCount: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const lockedCount = await employeeSalaryDetailModel.disburseCycle(month, year, client);

      // Transition any exiting employees who were disbursed to TERMINATED
      await client.query(
        `UPDATE employee_details e
         SET status = 'TERMINATED', updated_at = (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT
         FROM employee_salary_details s
         WHERE s.employee_id = e.id
           AND s.payout_month = $1
           AND s.payout_year = $2
           AND s.status = 'PAID'
           AND e.status = 'EXITING'`,
        [month, year]
      );

      await client.query('COMMIT');
      return {
        success: true,
        lockedCount,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Disburse & Lock individual employee settlement (FnF event)
   * Atomically transitions employee_details status from 'EXITING' to 'TERMINATED'
   */
  async disburseIndividualSettlement(
    employeeId: number,
    month: number = 11,
    year: number = 2026
  ): Promise<EmployeeSalaryDetail> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const disbursed = await employeeSalaryDetailModel.disburseIndividual(
        employeeId,
        month,
        year,
        client
      );

      if (!disbursed) {
        throw new AppError(
          `Cannot disburse settlement: record not found in Draft status for employee ${employeeId}`,
          400
        );
      }

      // Transition employee_details status from EXITING to TERMINATED
      await client.query(
        "UPDATE employee_details SET status = 'TERMINATED', updated_at = (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT WHERE id = $1",
        [employeeId]
      );

      await client.query('COMMIT');
      return disbursed;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Generate mid-month prorated settlement for exiting employee
   */
  async generateSettlement(
    employeeId: number,
    month: number = 11,
    year: number = 2026
  ): Promise<EmployeeSalaryDetail> {
    const emp = await employeeDetailModel.findByIdWithDetails(employeeId);
    if (!emp) {
      throw new AppError(`Employee with ID ${employeeId} not found`, 404);
    }

    if (!emp.last_working_day) {
      throw new AppError(`Employee ${emp.employee_id} does not have a designated Last Working Day`, 400);
    }

    const rule = await salaryComponentRuleModel.findByRoleAndCountry(
      emp.role_id,
      emp.country_code
    );
    if (!rule) {
      throw new AppError(`Policy rule not found for Role ${emp.role_id} and Country ${emp.country_code}`, 404);
    }

    const financials = salaryCalculatorService.calculateProratedSettlement(
      Number(emp.annual_ctc),
      rule,
      month,
      year,
      emp.last_working_day
    );

    const snapshot = salaryCalculatorService.buildSnapshot(
      financials,
      rule,
      {
        role_title: emp.role_title || '',
        role_level: (emp.role_level as SeniorityLevel) || 'MID_LEVEL',
        country_code: emp.country_code,
        department_name: emp.department_name || '',
      },
      {
        is_prorated: true,
        total_working_days: financials.total_working_days,
        actual_days_worked: financials.actual_days_worked,
      },
      `Prorated exit settlement up to LWD: ${emp.last_working_day}`
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await employeeSalaryDetailModel.batchUpsertChunk(client, [
        {
          employee_id: emp.id,
          payout_month: month,
          payout_year: year,
          base_salary: financials.base_salary,
          allowance: financials.allowance,
          bonus: financials.bonus,
          employer_retirals: financials.employer_retirals,
          gross_salary: financials.gross_salary,
          tax_deduction: financials.tax_deduction,
          net_salary: financials.net_salary,
          calculation_snapshot: snapshot,
          status: 'DRAFT',
        },
      ]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const settlementRecord = await employeeSalaryDetailModel.findByEmployeeAndCycle(employeeId, month, year);
    if (!settlementRecord) {
      throw new AppError(`Failed to retrieve generated settlement for employee ID ${employeeId}`, 500);
    }
    return settlementRecord;
  }
}

export const payrollService = new PayrollService();
