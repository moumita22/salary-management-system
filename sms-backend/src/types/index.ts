// ==========================================
// Database & Connection Interfaces
// ==========================================

export type QueryParam =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type QueryRow = Record<string, unknown>;

export interface FieldDef {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

export interface QueryResult<R = QueryRow> {
  rows: R[];
  rowCount: number | null;
  command: string;
  fields: FieldDef[];
}

export interface PoolClient {
  query<R = QueryRow>(text: string, params?: QueryParam[]): Promise<QueryResult<R>>;
  release(err?: Error | boolean): void;
}

export interface DbPool {
  query<R = QueryRow>(text: string, params?: QueryParam[]): Promise<QueryResult<R>>;
  connect(): Promise<PoolClient>;
  on(event: string, listener: (...args: unknown[]) => void): this;
  end(): Promise<void>;
  totalCount?: number;
  idleCount?: number;
  waitingCount?: number;
}

export interface PoolConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// ==========================================
// Model Pagination Interfaces
// ==========================================

export interface PaginationOptions<T = QueryRow> {
  page?: number;
  limit?: number;
  filter?: Partial<T>;
  sort?: {
    field?: keyof T | string;
    order?: 'ASC' | 'DESC' | 'asc' | 'desc';
  };
  search?: {
    query: string;
    columns: Array<keyof T | string>;
  };
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ==========================================
// Core Database Entity Types
// ==========================================

export type SeniorityLevel = 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
export type SalaryStatus = 'DRAFT' | 'PAID';
export type CycleStatus = 'DRAFT' | 'PAID' | 'PARTIAL' | 'MIXED' | 'EMPTY';

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
  department_code?: string;
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
  created_at?: number;
  updated_at?: number;
  // Joined fields
  role_title?: string;
  role_level?: SeniorityLevel;
  department_id?: string;
  department_name?: string;
}

export interface DirectoryEmployee extends EmployeeDetail {
  department_pk?: number;
  salary_id?: number | null;
  base_salary?: number | null;
  allowance?: number | null;
  bonus?: number | null;
  added_bonus?: number | null;
  employer_retirals?: number | null;
  gross_salary?: number | null;
  tax_deduction?: number | null;
  net_salary?: number | null;
  salary_status?: SalaryStatus | null;
  calculation_snapshot?: CalculationSnapshot | null;
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
  overrides_applied?: {
    modified_at: string;
    customAdditions: Array<{ name: string; amount: number }>;
  };
}

export interface EmployeeSalaryDetail {
  id: number;
  employee_id: number;
  payout_month: number;
  payout_year: number;
  base_salary: number;
  allowance: number;
  bonus: number;
  added_bonus?: number;
  employer_retirals: number;
  gross_salary: number;
  tax_deduction: number;
  net_salary: number;
  calculation_snapshot: CalculationSnapshot;
  status: SalaryStatus;
  paid_at?: number | null;
  created_at?: number;
  updated_at?: number;
}

export interface CycleMetrics {
  total_eligible: number;
  total_records: number;
  draft_count: number;
  paid_count: number;
  total_gross: number;
  total_net: number;
  status: CycleStatus;
  bonus_recipients?: Array<{ employee_id: string; added_bonus: number }>;
}

export interface SalaryBatchRecord {
  employee_id: number;
  payout_month: number;
  payout_year: number;
  base_salary: number;
  allowance: number;
  bonus: number;
  added_bonus?: number;
  employer_retirals: number;
  gross_salary: number;
  tax_deduction: number;
  net_salary: number;
  calculation_snapshot: CalculationSnapshot;
  status: SalaryStatus;
}

// Feathers-style Service Params & Results
export interface ServiceQueryParams {
  [key: string]: unknown;
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
export interface HookContext<T = unknown> {
  method: 'find' | 'get' | 'create' | 'patch' | 'remove';
  type: 'before' | 'after' | 'error';
  serviceName: string;
  id?: number | string;
  data?: unknown;
  params?: ServiceQueryParams;
  result?: T;
  error?: unknown;
}

export type HookFunction<T = unknown> = (
  context: HookContext<T>
) => Promise<HookContext<T> | void> | HookContext<T> | void;

export interface ServiceHooks<T = unknown> {
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

// ==========================================
// Authentication & User Interfaces
// ==========================================

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: 'ADMIN';
  created_at?: number;
}

export interface AuthSessionUser {
  id: number;
  username: string;
  full_name: string;
  role: 'ADMIN';
}

export interface LoginResponse {
  success: true;
  token: string;
  user: AuthSessionUser;
}

// ==========================================
// Application Errors
// ==========================================

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400, name: string = 'AppError') {
    super(message);
    this.statusCode = statusCode;
    this.name = name;
  }
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  error: string;
  timestamp: string;
}

export function formatErrorResponse(
  err: unknown,
  defaultStatus: number = 500,
  defaultCode: string = 'ServerError'
): { status: number; body: ApiErrorResponse } {
  const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null;
  const status = typeof errObj?.statusCode === 'number' ? errObj.statusCode : defaultStatus;
  const rawCode =
    typeof errObj?.name === 'string'
      ? errObj.name
      : typeof errObj?.code === 'string'
        ? errObj.code
        : defaultCode;
  const message =
    err instanceof Error
      ? err.message
      : typeof errObj?.message === 'string'
        ? errObj.message
        : 'An unexpected error occurred';
  const code = typeof rawCode === 'string' && rawCode !== 'Error' ? rawCode : defaultCode;

  return {
    status,
    body: {
      success: false,
      statusCode: status,
      code,
      error: message,
      timestamp: new Date().toISOString(),
    },
  };
}
