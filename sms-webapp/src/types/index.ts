export type SeniorityLevel = 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
export type SalaryStatus = 'DRAFT' | 'PAID' | 'PARTIAL' | 'MIXED' | 'EMPTY';

export interface CycleMetrics {
  total_eligible: number;
  total_records: number;
  draft_count: number;
  paid_count: number;
  total_gross: number;
  total_net: number;
  status: SalaryStatus;
  bonus_recipients?: Array<{ employee_id: string; added_bonus: number }>;
}

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
  overrides_applied?: {
    modified_at: string;
    customAdditions: Array<{ name: string; amount: number }>;
  };
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
  added_bonus?: number;
  employer_retirals?: number;
  gross_salary?: number;
  tax_deduction?: number;
  net_salary?: number;
  salary_status?: SalaryStatus;
  calculation_snapshot?: CalculationSnapshot;
  paid_at?: number | null;
  created_at?: number;
  updated_at?: number;
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
