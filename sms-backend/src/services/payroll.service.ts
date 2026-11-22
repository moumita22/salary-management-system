import { pool, query } from '../config/db.js';
import { salaryCalculatorService } from './salaryCalculator.service.js';
import { employeeSalaryDetailModel } from '../models/employee_salary_details.model.js';
import { employeeDetailModel } from '../models/employee_details.model.js';
import { salaryComponentRuleModel } from '../models/salary_component_rules.model.js';
import { departmentModel } from '../models/departments.model.js';

export interface PayrollFilterOptions {
  departmentId?: string | number;
  countryCode?: string;
  level?: string;
  search?: string;
}

export class PayrollService {
  /**
   * Financial Immutability Guard (Domain level, NOT Express middleware)
   * Throws 403 Forbidden if a salary record is already finalized and paid.
   */
  assertNotPaid(record: { status: string }): void {
    if (record.status === 'PAID') {
      const err: any = new Error(
        'Financial Immutability Violation: Payroll for this employee and period has been PAID and locked against modification.'
      );
      err.statusCode = 403;
      err.name = 'FinancialLockError';
      throw err;
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

    // 1. Guard against re-generating an already finalized/paid month
    const metrics = await employeeSalaryDetailModel.getCycleMetrics(month, year);
    if (metrics.status === 'PAID') {
      const err: any = new Error(
        `Payroll for ${month}/${year} is finalized and locked (status: PAID). Cannot re-generate.`
      );
      err.statusCode = 403;
      throw err;
    }

    // 2. Load all policy rules into an in-memory lookup map: `${role_id}_${country_code}`
    const rulesList = await salaryComponentRuleModel.find();
    const rulesMap = new Map<string, any>();
    for (const rule of rulesList) {
      rulesMap.set(`${rule.role_id}_${rule.country_code}`, rule);
    }

    // 3. Load all eligible employees active during this cycle (with optional scoping filters)
    const daysInMonth = new Date(year, month, 0).getDate();
    const cycleStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const cycleEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const conditions: string[] = [
      'e.date_of_joining <= $2',
      '(e.last_working_day IS NULL OR e.last_working_day >= $1)',
    ];
    const values: any[] = [cycleStart, cycleEnd];
    let pIdx = 3;

    if (filters.departmentId) {
      const isCode = typeof filters.departmentId === 'string' && filters.departmentId.startsWith('DEP-');
      const dept = isCode
        ? await departmentModel.findByCode(filters.departmentId)
        : await departmentModel.findById(Number(filters.departmentId));
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
      conditions.push(
        `(e.first_name ILIKE $${pIdx} OR e.last_name ILIKE $${pIdx} OR e.employee_id ILIKE $${pIdx} OR e.email ILIKE $${pIdx})`
      );
      values.push(`%${filters.search.trim()}%`);
      pIdx++;
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
    const employeesRes = await query(employeesSql, values);
    const employees = employeesRes.rows;

    // 4. Transform and calculate each employee's salary breakdown in memory using Integer Cents
    const calculatedRows: any[] = [];
    for (const emp of employees) {
      const rule = rulesMap.get(`${emp.role_id}_${emp.country_code}`);
      if (!rule) {
        throw new Error(
          `Missing policy rule for Role ID ${emp.role_id} and Country '${emp.country_code}' (Employee: ${emp.employee_id})`
        );
      }

      // Check if mid-month exit in this cycle
      const isExitThisMonth =
        emp.last_working_day &&
        new Date(emp.last_working_day).getMonth() + 1 === month &&
        new Date(emp.last_working_day).getFullYear() === year;

      // Check if mid-month joining in this cycle
      const joinDate = new Date(emp.date_of_joining);
      const isJoinThisMonth =
        joinDate.getMonth() + 1 === month &&
        joinDate.getFullYear() === year &&
        joinDate.getDate() > 1;

      let financials: any;
      let prorationMeta: any = undefined;

      if (isExitThisMonth) {
        financials = salaryCalculatorService.calculateProratedSettlement(
          Number(emp.annual_ctc),
          rule,
          month,
          year,
          emp.last_working_day
        );
        prorationMeta = {
          is_prorated: true,
          total_working_days: financials.total_working_days,
          actual_days_worked: financials.actual_days_worked,
        };
      } else if (isJoinThisMonth) {
        financials = salaryCalculatorService.calculateMidMonthJoinProration(
          Number(emp.annual_ctc),
          rule,
          month,
          year,
          emp.date_of_joining
        );
        prorationMeta = {
          is_prorated: true,
          total_working_days: financials.total_working_days,
          actual_days_worked: financials.actual_days_worked,
        };
      } else {
        financials = salaryCalculatorService.calculateMonthlySalary(
          Number(emp.annual_ctc),
          rule
        );
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

      calculatedRows.push({
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
      });
    }

    // 5. ACID Database Transaction with batch chunking (1,000 rows per batch)
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
    overrides: {
      base_salary?: number;
      allowance?: number;
      bonus?: number;
      tax_deduction?: number;
    },
    customAdditions: Array<{ name: string; amount: number }> = []
  ): Promise<any> {
    const existing = await employeeSalaryDetailModel.findByEmployeeAndCycle(
      employeeId,
      month,
      year
    );

    if (!existing) {
      const err: any = new Error(
        `No salary draft found for employee ID ${employeeId} in ${month}/${year}. Generate payroll first.`
      );
      err.statusCode = 404;
      throw err;
    }

    // Financial Immutability Guard
    this.assertNotPaid(existing);

    const baseSalary = overrides.base_salary !== undefined ? overrides.base_salary : Number(existing.base_salary);
    const allowance = overrides.allowance !== undefined ? overrides.allowance : Number(existing.allowance);
    const bonus = overrides.bonus !== undefined ? overrides.bonus : Number(existing.bonus);

    const customTotal = customAdditions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const deductionPct = existing.calculation_snapshot?.deduction_percentage || 12;

    const recalculated = salaryCalculatorService.recalculateOverride(
      baseSalary,
      allowance,
      bonus,
      deductionPct,
      customTotal
    );

    const updatedSnapshot = {
      ...existing.calculation_snapshot,
      overrides_applied: {
        overrides,
        customAdditions,
        modified_at: new Date().toISOString(),
      },
    };

    return employeeSalaryDetailModel.update(existing.id, {
      base_salary: recalculated.base_salary,
      allowance: recalculated.allowance,
      bonus: recalculated.bonus,
      gross_salary: recalculated.gross_salary,
      tax_deduction: recalculated.tax_deduction,
      net_salary: recalculated.net_salary,
      calculation_snapshot: updatedSnapshot,
    });
  }

  /**
   * Disburse & Lock Payroll (Month-End Payday event)
   */
  async disbursePayroll(
    month: number = 11,
    year: number = 2026
  ): Promise<{ success: boolean; lockedCount: number }> {
    const lockedCount = await employeeSalaryDetailModel.disburseCycle(month, year);
    return {
      success: true,
      lockedCount,
    };
  }

  /**
   * Generate mid-month prorated settlement for exiting employee
   */
  async generateSettlement(
    employeeId: number,
    month: number = 11,
    year: number = 2026
  ): Promise<any> {
    const emp = await employeeDetailModel.findById(employeeId);
    if (!emp) {
      const err: any = new Error(`Employee with ID ${employeeId} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (!emp.last_working_day) {
      const err: any = new Error(`Employee ${emp.employee_id} does not have a designated Last Working Day`);
      err.statusCode = 400;
      throw err;
    }

    const rule = await salaryComponentRuleModel.findByRoleAndCountry(
      emp.role_id,
      emp.country_code
    );
    if (!rule) {
      const err: any = new Error(`Policy rule not found for Role ${emp.role_id} and Country ${emp.country_code}`);
      err.statusCode = 404;
      throw err;
    }

    const financials = salaryCalculatorService.calculateProratedSettlement(
      Number(emp.annual_ctc),
      rule,
      month,
      year,
      emp.last_working_day
    );

    // Fetch role & dept info for snapshot
    const details = await employeeDetailModel.findDirectoryPaginated({
      search: emp.employee_id,
      limit: 1,
      month,
      year,
    });
    const meta = details.data[0] || {};

    const snapshot = salaryCalculatorService.buildSnapshot(
      financials,
      rule,
      {
        role_title: meta.role_title || '',
        role_level: meta.role_level || '',
        country_code: emp.country_code,
        department_name: meta.department_name || '',
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

    return employeeSalaryDetailModel.findByEmployeeAndCycle(employeeId, month, year);
  }
}

export const payrollService = new PayrollService();
