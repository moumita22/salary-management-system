/**
 * Financial Currency Utilities using Integer Cents
 * Eliminates IEEE-754 floating point precision errors ($0.1 + 0.2 = 0.30000000000000004).
 */

import { getDaysInMonth } from './dates.js';

export interface RulePercentages {
  base_percentage: number;
  allowance_percentage: number;
  bonus_percentage: number;
  employer_retirals_percentage: number;
  deduction_percentage: number;
}

export interface CalculatedFinancials {
  annual_ctc: number;
  monthly_ctc: number;
  base_salary: number;
  allowance: number;
  bonus: number;
  employer_retirals: number;
  gross_salary: number;
  tax_deduction: number;
  net_salary: number;
  cents: {
    monthly_ctc: number;
    base_salary: number;
    allowance: number;
    bonus: number;
    employer_retirals: number;
    gross_salary: number;
    tax_deduction: number;
    net_salary: number;
  };
}

/**
 * Convert USD dollars to integer cents
 */
export function toCents(dollars: number | string): number {
  const num = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Convert integer cents back to USD dollars with 2 decimal places
 */
export function toDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Calculate full-time monthly salary breakdown using integer cents.
 * Guarantees exact mathematical reconciliation:
 * 1. gross_salary === base_salary + allowance + bonus
 * 2. net_salary === gross_salary - tax_deduction
 */
export function calculateSalaryInCents(
  annualCtc: number,
  rules: RulePercentages
): CalculatedFinancials {
  const annualCtcCents = toCents(annualCtc);
  const monthlyCtcCents = Math.round(annualCtcCents / 12);

  // Calculate component parts in integer cents
  const baseSalaryCents = Math.round((monthlyCtcCents * rules.base_percentage) / 100);
  const allowanceCents = Math.round((monthlyCtcCents * rules.allowance_percentage) / 100);
  const bonusCents = Math.round((monthlyCtcCents * rules.bonus_percentage) / 100);
  const retiralsCents = Math.round((monthlyCtcCents * rules.employer_retirals_percentage) / 100);

  // Exact Earnings Reconciliation (Gross = Base + Allowance + Bonus)
  const grossSalaryCents = baseSalaryCents + allowanceCents + bonusCents;

  // Deductions & Net Reconciliation (Net = Gross - Tax)
  const taxDeductionCents = Math.round((grossSalaryCents * rules.deduction_percentage) / 100);
  const netSalaryCents = grossSalaryCents - taxDeductionCents;

  return {
    annual_ctc: toDollars(annualCtcCents),
    monthly_ctc: toDollars(monthlyCtcCents),
    base_salary: toDollars(baseSalaryCents),
    allowance: toDollars(allowanceCents),
    bonus: toDollars(bonusCents),
    employer_retirals: toDollars(retiralsCents),
    gross_salary: toDollars(grossSalaryCents),
    tax_deduction: toDollars(taxDeductionCents),
    net_salary: toDollars(netSalaryCents),
    cents: {
      monthly_ctc: monthlyCtcCents,
      base_salary: baseSalaryCents,
      allowance: allowanceCents,
      bonus: bonusCents,
      employer_retirals: retiralsCents,
      gross_salary: grossSalaryCents,
      tax_deduction: taxDeductionCents,
      net_salary: netSalaryCents,
    },
  };
}

/**
 * Calculate prorated earnings based on explicit days worked in a month.
 * Handles both mid-month joins (daysWorked = totalDays - joinDay + 1)
 * and mid-month exits (daysWorked = exitDay).
 */
export function calculateProratedForDaysWorkedInCents(
  annualCtc: number,
  rules: RulePercentages,
  daysWorked: number,
  totalDaysInMonth: number
): CalculatedFinancials & {
  is_prorated: boolean;
  total_working_days: number;
  actual_days_worked: number;
} {
  const boundedDaysWorked = Math.max(1, Math.min(daysWorked, totalDaysInMonth));
  const isProrated = boundedDaysWorked < totalDaysInMonth;
  const standard = calculateSalaryInCents(annualCtc, rules);

  if (!isProrated) {
    return {
      ...standard,
      is_prorated: false,
      total_working_days: totalDaysInMonth,
      actual_days_worked: totalDaysInMonth,
    };
  }

  // Prorate earnings based on actual days worked
  const proratedBaseCents = Math.round((standard.cents.base_salary / totalDaysInMonth) * boundedDaysWorked);
  const proratedAllowanceCents = Math.round((standard.cents.allowance / totalDaysInMonth) * boundedDaysWorked);
  const proratedBonusCents = Math.round((standard.cents.bonus / totalDaysInMonth) * boundedDaysWorked);
  const proratedRetiralsCents = Math.round((standard.cents.employer_retirals / totalDaysInMonth) * boundedDaysWorked);

  const proratedGrossCents = proratedBaseCents + proratedAllowanceCents + proratedBonusCents;
  const proratedTaxCents = Math.round((proratedGrossCents * rules.deduction_percentage) / 100);
  const proratedNetCents = proratedGrossCents - proratedTaxCents;

  return {
    annual_ctc: standard.annual_ctc,
    monthly_ctc: standard.monthly_ctc,
    base_salary: toDollars(proratedBaseCents),
    allowance: toDollars(proratedAllowanceCents),
    bonus: toDollars(proratedBonusCents),
    employer_retirals: toDollars(proratedRetiralsCents),
    gross_salary: toDollars(proratedGrossCents),
    tax_deduction: toDollars(proratedTaxCents),
    net_salary: toDollars(proratedNetCents),
    is_prorated: true,
    total_working_days: totalDaysInMonth,
    actual_days_worked: boundedDaysWorked,
    cents: {
      monthly_ctc: standard.cents.monthly_ctc,
      base_salary: proratedBaseCents,
      allowance: proratedAllowanceCents,
      bonus: proratedBonusCents,
      employer_retirals: proratedRetiralsCents,
      gross_salary: proratedGrossCents,
      tax_deduction: proratedTaxCents,
      net_salary: proratedNetCents,
    },
  };
}

/**
 * Calculate prorated settlement for mid-month exits based on exact calendar days.
 * Dynamically handles February (28/29 days) and 30 vs 31-day months.
 */
export function calculateProratedInCents(
  annualCtc: number,
  rules: RulePercentages,
  month: number,
  year: number,
  lastWorkingDayStr?: string | Date | null
): CalculatedFinancials & {
  is_prorated: boolean;
  total_working_days: number;
  actual_days_worked: number;
} {
  // Dynamically calculate actual days in the target month (Loophole 5 fix)
  const totalDaysInMonth = getDaysInMonth(month, year);

  // Parse exit day from LWD (can be Date object or ISO string like '2026-11-20')
  let daysWorked = totalDaysInMonth;
  if (lastWorkingDayStr) {
    const dateStr =
      lastWorkingDayStr instanceof Date
        ? lastWorkingDayStr.toISOString().split('T')[0]
        : String(lastWorkingDayStr).split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      const parsedDay = parseInt(parts[2], 10);
      if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= totalDaysInMonth) {
        daysWorked = parsedDay;
      }
    }
  }

  return calculateProratedForDaysWorkedInCents(annualCtc, rules, daysWorked, totalDaysInMonth);
}

/**
 * Recalculate totals after manual HR override adjustments
 */
export function recalculateOverrideInCents(
  baseSalary: number,
  allowance: number,
  bonus: number,
  deductionPct: number,
  customAdditionsTotal: number = 0
): {
  base_salary: number;
  allowance: number;
  bonus: number;
  added_bonus: number;
  gross_salary: number;
  tax_deduction: number;
  net_salary: number;
} {
  const baseCents = toCents(baseSalary);
  const allowanceCents = toCents(allowance);
  const bonusCents = toCents(bonus);
  const addedBonusCents = toCents(customAdditionsTotal);

  const grossCents = baseCents + allowanceCents + bonusCents + addedBonusCents;
  const taxCents = Math.round((grossCents * deductionPct) / 100);
  const netCents = grossCents - taxCents;

  return {
    base_salary: toDollars(baseCents),
    allowance: toDollars(allowanceCents),
    bonus: toDollars(bonusCents),
    added_bonus: toDollars(addedBonusCents),
    gross_salary: toDollars(grossCents),
    tax_deduction: toDollars(taxCents),
    net_salary: toDollars(netCents),
  };
}
