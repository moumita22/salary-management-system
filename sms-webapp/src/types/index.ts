export type SeniorityLevel = 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
export type SalaryStatus = 'DRAFT' | 'PAID';

export interface Department {
  id: number;
  department_id: string;
  name: string;
  employee_count?: number;
  created_at?: string;
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

export interface SalaryBreakdown {
  id?: number;
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
  calculation_snapshot?: CalculationSnapshot;
  status: SalaryStatus;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  country_code: string;
  annual_ctc: number | string;
  status: string;
  date_of_joining: string;
  last_working_day?: string | null;
  role_title?: string;
  role_level?: SeniorityLevel;
  department_id?: string;
  department_name?: string;
  salary_id?: number | null;
  base_salary?: number;
  allowance?: number;
  bonus?: number;
  employer_retirals?: number;
  gross_salary?: number;
  tax_deduction?: number;
  net_salary?: number;
  salary_status?: SalaryStatus;
  calculation_snapshot?: CalculationSnapshot;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface SalaryOverridePayload {
  employee_id: number;
  payout_month: number;
  payout_year: number;
  base_salary?: number;
  allowance?: number;
  bonus?: number;
  tax_deduction?: number;
  notes?: string;
}

export interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}
