// Core database entity types

export type SeniorityLevel = 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
export type SalaryStatus = 'DRAFT' | 'PAID';

export interface Department {
  id: number;
  department_id: string;
  name: string;
}

export interface DepartmentWithHeadcount extends Department {
  employee_count: number;
}

export interface Role {
  id: number;
  department_id: number;
  title: string;
  level: SeniorityLevel;
  department_name?: string;
}

export interface SalaryComponentRule {
  id: number;
  role_id: number;
  country_code: string;
  base_percentage: number;
  allowance_percentage: number;
  bonus_percentage: number;
  employer_retirals_percentage: number;
  deduction_percentage: number;
  role_title?: string;
  role_level?: SeniorityLevel;
  department_name?: string;
}

export interface EmployeeDetail {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  country_code: string;
  annual_ctc: number;
  status: string;
  date_of_joining: string;
  last_working_day?: string | null;
  created_at?: string;
  // Joined fields
  role_title?: string;
  role_level?: SeniorityLevel;
  department_id?: string;
  department_name?: string;
}

export interface CalculationSnapshot {
  annual_ctc: number;
  monthly_ctc: number;
  base_percentage: number;
  allowance_percentage: number;
  bonus_percentage: number;
  employer_retirals_percentage: number;
  deduction_percentage: number;
  country_code: string;
  role_title: string;
  role_level: SeniorityLevel;
  department_name: string;
  is_prorated?: boolean;
  total_working_days?: number;
  actual_days_worked?: number;
  generated_at: string;
  notes?: string;
}

export interface EmployeeSalaryDetail {
  id: number;
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
  calculation_snapshot: CalculationSnapshot;
  status: SalaryStatus;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Feathers-style Service Params & Results
export interface ServiceQueryParams {
  [key: string]: any;
  $limit?: number;
  $skip?: number;
  $sortField?: string;
  $sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  $search?: string;
}

export interface ServiceFindResult<T> {
  total: number;
  limit: number;
  skip: number;
  data: T[];
}

// Feathers-style Hook Context
export interface HookContext<T = any> {
  method: 'find' | 'get' | 'create' | 'patch' | 'remove';
  type: 'before' | 'after' | 'error';
  serviceName: string;
  id?: number | string;
  data?: any;
  params?: ServiceQueryParams;
  result?: T;
  error?: any;
}

export type HookFunction<T = any> = (
  context: HookContext<T>
) => Promise<HookContext<T> | void> | HookContext<T> | void;

export interface ServiceHooks<T = any> {
  before?: {
    all?: HookFunction<T>[];
    find?: HookFunction<T>[];
    get?: HookFunction<T>[];
    create?: HookFunction<T>[];
    patch?: HookFunction<T>[];
    remove?: HookFunction<T>[];
  };
  after?: {
    all?: HookFunction<T>[];
    find?: HookFunction<T>[];
    get?: HookFunction<T>[];
    create?: HookFunction<T>[];
    patch?: HookFunction<T>[];
    remove?: HookFunction<T>[];
  };
  error?: {
    all?: HookFunction<T>[];
    find?: HookFunction<T>[];
    get?: HookFunction<T>[];
    create?: HookFunction<T>[];
    patch?: HookFunction<T>[];
    remove?: HookFunction<T>[];
  };
}
