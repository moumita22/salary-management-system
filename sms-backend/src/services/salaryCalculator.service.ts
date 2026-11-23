import {
  calculateSalaryInCents,
  calculateProratedInCents,
  calculateProratedForDaysWorkedInCents,
  recalculateOverrideInCents,
  getDaysInMonth,
  RulePercentages,
  CalculatedFinancials,
} from '../utils/index.js';
import { AppError, type CalculationSnapshot, type SeniorityLevel } from '../types/index.js';

export class SalaryCalculatorService {
  /**
   * Enforce and validate the 100% Policy Rule Constraint
   * Base% + Allowance% + Bonus% + Retirals% === 100.00%
   */
  validateRulePercentages(rule: RulePercentages): void {
    const total =
      Number(rule.base_percentage) +
      Number(rule.allowance_percentage) +
      Number(rule.bonus_percentage) +
      Number(rule.employer_retirals_percentage);

    // Strict 2-decimal sum check
    if (Math.abs(total - 100.0) > 0.001) {
      throw new AppError(
        `Invalid Policy Rule: Base (${rule.base_percentage}%) + Allowance (${rule.allowance_percentage}%) + Bonus (${rule.bonus_percentage}%) + Retirals (${rule.employer_retirals_percentage}%) sums to ${total.toFixed(2)}%, but must equal exactly 100.00%.`,
        400,
        'InvalidRuleError'
      );
    }

    if (rule.deduction_percentage < 0 || rule.deduction_percentage > 50) {
      throw new AppError(
        `Invalid Deduction Percentage: ${rule.deduction_percentage}% must be between 0% and 50%.`,
        400,
        'InvalidDeductionError'
      );
    }
  }

  /**
   * Calculate standard full-month compensation for an employee
   */
  calculateMonthlySalary(
    annualCtc: number,
    rule: RulePercentages
  ): CalculatedFinancials {
    this.validateRulePercentages(rule);
    return calculateSalaryInCents(annualCtc, rule);
  }

  /**
   * Calculate mid-month exit prorated settlement (Loophole 5 fix)
   */
  calculateProratedSettlement(
    annualCtc: number,
    rule: RulePercentages,
    month: number,
    year: number,
    lastWorkingDay?: string | Date | null
  ) {
    this.validateRulePercentages(rule);
    return calculateProratedInCents(annualCtc, rule, month, year, lastWorkingDay);
  }

  /**
   * Calculate mid-month joining prorated salary based on joining date
   */
  calculateMidMonthJoinProration(
    annualCtc: number,
    rule: RulePercentages,
    month: number,
    year: number,
    dateOfJoining: string | Date
  ) {
    this.validateRulePercentages(rule);
    const totalDaysInMonth = getDaysInMonth(month, year);
    const joinDate = new Date(dateOfJoining);
    const joinDay = joinDate.getDate();
    const daysWorked = Math.max(1, totalDaysInMonth - joinDay + 1);
    return calculateProratedForDaysWorkedInCents(annualCtc, rule, daysWorked, totalDaysInMonth);
  }

  /**
   * Build immutable JSON calculation snapshot (Loophole 3 fix)
   */
  buildSnapshot(
    financials: CalculatedFinancials,
    rule: RulePercentages,
    employeeMeta: {
      role_title: string;
      role_level: SeniorityLevel;
      country_code: string;
      department_name: string;
    },
    prorationMeta?: {
      is_prorated: boolean;
      total_working_days: number;
      actual_days_worked: number;
    },
    notes?: string
  ): CalculationSnapshot {
    return {
      annual_ctc: financials.annual_ctc,
      monthly_ctc: financials.monthly_ctc,
      base_percentage: Number(rule.base_percentage),
      allowance_percentage: Number(rule.allowance_percentage),
      bonus_percentage: Number(rule.bonus_percentage),
      employer_retirals_percentage: Number(rule.employer_retirals_percentage),
      deduction_percentage: Number(rule.deduction_percentage),
      country_code: employeeMeta.country_code,
      role_title: employeeMeta.role_title,
      role_level: employeeMeta.role_level,
      department_name: employeeMeta.department_name,
      is_prorated: prorationMeta?.is_prorated || false,
      total_working_days: prorationMeta?.total_working_days,
      actual_days_worked: prorationMeta?.actual_days_worked,
      generated_at: new Date().toISOString(),
      notes,
    };
  }

  /**
   * Recalculate salary following manual HR override
   */
  recalculateOverride(
    baseSalary: number,
    allowance: number,
    bonus: number,
    deductionPct: number,
    customAdditionsTotal: number = 0
  ) {
    return recalculateOverrideInCents(
      baseSalary,
      allowance,
      bonus,
      deductionPct,
      customAdditionsTotal
    );
  }
}

export const salaryCalculatorService = new SalaryCalculatorService();
