import { describe, it, expect } from 'bun:test';
import {
  calculateSalaryInCents,
  calculateProratedInCents,
  recalculateOverrideInCents,
  toCents,
  toDollars,
} from '../src/utils/currency.js';
import { SalaryCalculatorService } from '../src/services/salaryCalculator.service.js';
import { PayrollService } from '../src/services/payroll.service.js';
import { BaseModel } from '../src/models/base.model.js';

describe('Financial Math & Currency Utilities (Integer Cents)', () => {
  it('should accurately convert dollars to cents and back without float drift', () => {
    expect(toCents(100.55)).toBe(10055);
    expect(toDollars(10055)).toBe(100.55);
    expect(toCents('2500.00')).toBe(250000);
  });

  it('should calculate standard full-month salary and guarantee exact reconciliation', () => {
    const annualCtc = 120000; // $10,000/month
    const rule = {
      base_percentage: 50.0,
      allowance_percentage: 25.0,
      bonus_percentage: 15.0,
      employer_retirals_percentage: 10.0,
      deduction_percentage: 12.0,
    };

    const result = calculateSalaryInCents(annualCtc, rule);

    expect(result.monthly_ctc).toBe(10000.0);
    expect(result.base_salary).toBe(5000.0);
    expect(result.allowance).toBe(2500.0);
    expect(result.bonus).toBe(1500.0);
    expect(result.employer_retirals).toBe(1000.0);

    // Guaranteed Earnings Reconciliation
    expect(result.gross_salary).toBe(
      Number((result.base_salary + result.allowance + result.bonus).toFixed(2))
    );
    expect(result.gross_salary).toBe(9000.0);

    // Guaranteed Net Reconciliation
    expect(result.tax_deduction).toBe(1080.0); // 12% of 9000
    expect(result.net_salary).toBe(7920.0); // 9000 - 1080
    expect(result.net_salary).toBe(
      Number((result.gross_salary - result.tax_deduction).toFixed(2))
    );
  });

  it('should accurately calculate mid-month exit proration using dynamic calendar days', () => {
    const annualCtc = 120000; // $10,000/mo, gross $9,000/mo
    const rule = {
      base_percentage: 50.0,
      allowance_percentage: 25.0,
      bonus_percentage: 15.0,
      employer_retirals_percentage: 10.0,
      deduction_percentage: 12.0,
    };

    // November 2026 has 30 days. Exit on the 20th -> 20/30 days worked
    const novProrated = calculateProratedInCents(annualCtc, rule, 11, 2026, '2026-11-20');
    expect(novProrated.is_prorated).toBe(true);
    expect(novProrated.total_working_days).toBe(30);
    expect(novProrated.actual_days_worked).toBe(20);

    // Full gross is 9000. 20/30 = 6000
    expect(novProrated.gross_salary).toBe(6000.0);
    expect(novProrated.tax_deduction).toBe(720.0); // 12% of 6000
    expect(novProrated.net_salary).toBe(5280.0); // 6000 - 720
  });

  it('should accurately prorate February (28 days in non-leap year)', () => {
    const annualCtc = 120000;
    const rule = {
      base_percentage: 50.0,
      allowance_percentage: 25.0,
      bonus_percentage: 15.0,
      employer_retirals_percentage: 10.0,
      deduction_percentage: 10.0,
    };

    // February 2025 has 28 days. Exit on the 14th -> 14/28 = 50%
    const febProrated = calculateProratedInCents(annualCtc, rule, 2, 2025, '2025-02-14');
    expect(febProrated.total_working_days).toBe(28);
    expect(febProrated.actual_days_worked).toBe(14);
    expect(febProrated.gross_salary).toBe(4500.0); // Exactly 50% of 9000
  });

  it('should accurately prorate mid-month joining for an employee joining on Oct 15 (31-day month)', () => {
    const service = new SalaryCalculatorService();
    const annualCtc = 120000; // Monthly gross: $9,000
    const rule = {
      base_percentage: 50.0,
      allowance_percentage: 25.0,
      bonus_percentage: 15.0,
      employer_retirals_percentage: 10.0,
      deduction_percentage: 10.0,
    };

    // Joining Oct 15, 2026: days worked = 31 - 15 + 1 = 17 days
    const joinProrated = service.calculateMidMonthJoinProration(
      annualCtc,
      rule,
      10,
      2026,
      '2026-10-15'
    );

    expect(joinProrated.is_prorated).toBe(true);
    expect(joinProrated.total_working_days).toBe(31);
    expect(joinProrated.actual_days_worked).toBe(17);
    // Base: round((5000 / 31) * 17) = round(2741.935) = 2741.94
    expect(joinProrated.base_salary).toBe(2741.94);
    // Gross: base + allowance + bonus
    expect(joinProrated.gross_salary).toBe(
      Number((joinProrated.base_salary + joinProrated.allowance + joinProrated.bonus).toFixed(2))
    );
    // Net: gross - tax
    expect(joinProrated.net_salary).toBe(
      Number((joinProrated.gross_salary - joinProrated.tax_deduction).toFixed(2))
    );
  });
});

describe('SalaryCalculatorService Rule Validation', () => {
  const service = new SalaryCalculatorService();

  it('should succeed when rule percentages sum to exactly 100%', () => {
    expect(() => {
      service.validateRulePercentages({
        base_percentage: 55.0,
        allowance_percentage: 25.0,
        bonus_percentage: 10.0,
        employer_retirals_percentage: 10.0,
        deduction_percentage: 8.0,
      });
    }).not.toThrow();
  });

  it('should throw an error when rule percentages do not sum to 100%', () => {
    expect(() => {
      service.validateRulePercentages({
        base_percentage: 60.0,
        allowance_percentage: 25.0,
        bonus_percentage: 10.0,
        employer_retirals_percentage: 10.0, // Sum = 105%
        deduction_percentage: 8.0,
      });
    }).toThrow(/must equal exactly 100.00%/);
  });
});

describe('Financial Immutability Guard', () => {
  const payroll = new PayrollService();

  it('should allow operations on DRAFT records', () => {
    expect(() => {
      payroll.assertNotPaid({ status: 'DRAFT' });
    }).not.toThrow();
  });

  it('should reject operations on PAID records with 403 Forbidden', () => {
    try {
      payroll.assertNotPaid({ status: 'PAID' });
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.name).toBe('FinancialLockError');
      expect(err.message).toMatch(/Financial Immutability Violation/);
    }
  });
});

describe('BaseModel Security: Column Allowlist Guard', () => {
  class TestModel extends BaseModel<any> {
    constructor() {
      super('test_table', 'id', ['id', 'name', 'email']);
    }

    public testColumn(col: string) {
      return this.assertValidColumn(col);
    }
  }

  const model = new TestModel();

  it('should allow valid registered columns', () => {
    expect(model.testColumn('id')).toBe('id');
    expect(model.testColumn('name')).toBe('name');
    expect(model.testColumn('email')).toBe('email');
  });

  it('should reject unauthorized or arbitrary SQL injection columns', () => {
    expect(() => {
      model.testColumn('salary; DROP TABLE users;--');
    }).toThrow(/Unauthorized column access/);

    expect(() => {
      model.testColumn('password_hash');
    }).toThrow(/Unauthorized column access/);
  });
});
