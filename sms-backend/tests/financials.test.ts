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

    // Verify Date object support (as returned by node-pg)
    const novDateObj = calculateProratedInCents(annualCtc, rule, 11, 2026, new Date('2026-11-20T00:00:00.000Z'));
    expect(novDateObj.actual_days_worked).toBe(20);
    expect(novDateObj.gross_salary).toBe(6000.0);
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

  it('should accurately calculate manual overrides with added bonus while keeping contractual bonus distinct', () => {
    // Base: 5000, Allowance: 2500, Bonus: 1500, Added Bonus: 500, Deduction: 10%
    const res = recalculateOverrideInCents(5000, 2500, 1500, 10, 500);

    expect(res.base_salary).toBe(5000.0);
    expect(res.allowance).toBe(2500.0);
    expect(res.bonus).toBe(1500.0);
    expect(res.added_bonus).toBe(500.0);
    // Gross = 5000 + 2500 + 1500 + 500 = 9500
    expect(res.gross_salary).toBe(9500.0);
    // Tax = 10% of 9500 = 950
    expect(res.tax_deduction).toBe(950.0);
    // Net = 9500 - 950 = 8550
    expect(res.net_salary).toBe(8550.0);
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

describe('DepartmentModel & Service Validation', () => {
  it('should correctly distinguish between numeric IDs and department codes in findByIdOrCode', async () => {
    const { departmentModel } = await import('../src/models/departments.model.js');
    let calledId: any = null;
    let calledCode: any = null;

    // Mock internal methods
    const originalFindById = departmentModel.findById;
    const originalFindByCode = departmentModel.findByCode;

    departmentModel.findById = async (id: any) => {
      calledId = id;
      return { id: 1, department_id: 'DEP-01', name: 'Engineering' } as any;
    };

    departmentModel.findByCode = async (code: any) => {
      calledCode = code;
      return { id: 1, department_id: 'DEP-01', name: 'Engineering' } as any;
    };

    try {
      // Numeric ID number
      await departmentModel.findByIdOrCode(1);
      expect(calledId).toBe(1);

      // Numeric ID string
      await departmentModel.findByIdOrCode('2');
      expect(calledId).toBe(2);

      // Formatted Code string
      await departmentModel.findByIdOrCode('DEP-01');
      expect(calledCode).toBe('DEP-01');

      // Lowercase Code string
      await departmentModel.findByIdOrCode('dep-02');
      expect(calledCode).toBe('dep-02');
    } finally {
      departmentModel.findById = originalFindById;
      departmentModel.findByCode = originalFindByCode;
    }
  });
});

describe('EmployeeDetailModel & EmployeeService Separation (PK vs UK)', () => {
  it('should route PK lookups to findByIdWithDetails and UK lookups to findByCodeWithDetails', async () => {
    const { employeeDetailModel } = await import('../src/models/employee_details.model.js');
    const { employeeService } = await import('../src/services/employee.service.js');

    let calledPk: number | null = null;
    let calledUk: string | null = null;

    const originalFindByIdWithDetails = employeeDetailModel.findByIdWithDetails;
    const originalFindByCodeWithDetails = employeeDetailModel.findByCodeWithDetails;

    employeeDetailModel.findByIdWithDetails = async (id: number) => {
      calledPk = id;
      return { id, employee_id: 'EMP-0001', first_name: 'John' } as any;
    };

    employeeDetailModel.findByCodeWithDetails = async (code: string) => {
      calledUk = code;
      return { id: 1, employee_id: code, first_name: 'John' } as any;
    };

    try {
      // 1. Service PK lookup
      await employeeService.getEmployeeById(42);
      expect(calledPk).toBe(42);

      // 2. Service UK lookup
      await employeeService.getEmployeeByCode('EMP-0042');
      expect(calledUk).toBe('EMP-0042');
    } finally {
      employeeDetailModel.findByIdWithDetails = originalFindByIdWithDetails;
      employeeDetailModel.findByCodeWithDetails = originalFindByCodeWithDetails;
    }
  });

  it('should validate mandatory fields when creating an employee', async () => {
    const { employeeService } = await import('../src/services/employee.service.js');

    // Missing first_name
    expect(employeeService.createEmployee({ email: 'test@example.com' } as any)).rejects.toThrow(
      /First name and last name are required/
    );

    // Invalid email
    expect(
      employeeService.createEmployee({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'invalid-email',
      } as any)
    ).rejects.toThrow(/A valid email address is required/);

    // Missing role_id
    expect(
      employeeService.createEmployee({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      } as any)
    ).rejects.toThrow(/Role ID is required/);

    // Missing or invalid annual CTC
    expect(
      employeeService.createEmployee({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        role_id: 1,
        country_code: 'IN',
        annual_ctc: 0,
      } as any)
    ).rejects.toThrow(/Annual CTC must be greater than zero/);
  });
});

describe('Standardized API Error Response Formatter', () => {
  it('should format AppError into standardized status code and body', async () => {
    const { AppError, formatErrorResponse } = await import('../src/types/index.js');

    const appErr = new AppError('Financial Immutability Violation', 403, 'FinancialLockError');
    const { status, body } = formatErrorResponse(appErr);

    expect(status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(403);
    expect(body.code).toBe('FinancialLockError');
    expect(body.error).toBe('Financial Immutability Violation');
    expect(body.timestamp).toBeDefined();
  });

  it('should format standard Error into default status code and code name', async () => {
    const { formatErrorResponse } = await import('../src/types/index.js');

    const genericErr = new Error('Database connection failed');
    const { status, body } = formatErrorResponse(genericErr, 500, 'DatabaseError');

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(500);
    expect(body.code).toBe('DatabaseError');
    expect(body.error).toBe('Database connection failed');
    expect(body.timestamp).toBeDefined();
  });
});

describe('Full Name Multi-field Search Support', () => {
  it('should find employee by full name (first + last name concatenation)', async () => {
    const { employeeDetailModel } = await import('../src/models/employee_details.model.js');
    const result = await employeeDetailModel.findDirectoryPaginated({
      search: 'Bryon Ryan',
    });

    expect(result.pagination.total).toBeGreaterThanOrEqual(1);
    const matched = result.data.find(
      (e) => e.first_name.toLowerCase() === 'bryon' && e.last_name.toLowerCase() === 'ryan'
    );
    expect(matched).toBeDefined();
    expect(matched?.employee_id).toBe('EMP-01027');
  });
});
