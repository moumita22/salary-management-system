import type {
  Department,
  Employee,
  PaginatedResponse,
} from '../types/index.js';

const API_BASE = '/api';

/**
 * Generic helper to handle fetch responses and errors
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// 1. Fetch all 12 departments with headcount counts
export async function getDepartments(): Promise<Department[]> {
  const res = await request<{ data?: Department[] } | Department[]>('/departments');
  return Array.isArray(res) ? res : res.data || [];
}

export interface GetEmployeesParams {
  departmentId?: string;
  countryCode?: string;
  level?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
}

// 2. Fetch paginated employees with filters and current month salary details
export async function getEmployees({
  departmentId = '',
  countryCode = '',
  level = '',
  search = '',
  status = '',
  page = 1,
  limit = 25,
  month = 11,
  year = 2026,
}: GetEmployeesParams = {}): Promise<PaginatedResponse<Employee>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    month: String(month),
    year: String(year),
  });

  if (departmentId) params.append('departmentId', departmentId);
  if (countryCode) params.append('countryCode', countryCode);
  if (level) params.append('level', level);
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  return request<PaginatedResponse<Employee>>(`/employees?${params.toString()}`);
}

// 3. Fetch exiting employees for the Exits & Settlements view
export async function getExitingEmployees({
  month = 11,
  year = 2026,
}: { month?: number; year?: number } = {}): Promise<Employee[]> {
  const res = await request<{ data?: Employee[] } | Employee[]>(
    `/employees/exits?month=${month}&year=${year}`
  );
  return Array.isArray(res) ? res : res.data || [];
}

// 4. Generate Monthly Payroll for all 10,000 employees for a given cycle
export async function generateMonthlyPayroll({
  month = 11,
  year = 2026,
}: { month?: number; year?: number } = {}): Promise<{ success: boolean; count: number; message: string }> {
  return request('/salaries/generate', {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  });
}

// 5. Update / Override an employee's monthly salary components
export async function updateEmployeeSalary(
  employeeId: number,
  payload: { month?: number; year?: number; overrides?: any; customAdditions?: any[] }
): Promise<any> {
  const { month = 11, year = 2026, overrides, customAdditions = [] } = payload;
  return request(`/salaries/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify({ month, year, overrides, customAdditions }),
  });
}

// 6. Generate and save mid-month prorated settlement for an exiting employee
export async function generateSettlement(
  employeeId: number,
  { month = 11, year = 2026 }: { month?: number; year?: number } = {}
): Promise<any> {
  return request(`/salaries/settlement/${employeeId}`, {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  });
}

// 7. Disburse & Lock Payroll (Month-End Payday event)
export async function disbursePayroll({
  month = 11,
  year = 2026,
}: { month?: number; year?: number } = {}): Promise<{ success: boolean; disbursedCount: number; message: string }> {
  return request('/salaries/disburse', {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  });
}
