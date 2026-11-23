import type {
  Department,
  Employee,
  PaginatedResponse,
} from '../types/index.js';

const API_BASE = '/api';

/**
 * Standardized API Error retaining HTTP status code, error code, and code-issue flags
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isCodeIssue: boolean;
  public timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'ServerError',
    timestamp: string = new Date().toISOString()
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = timestamp;
    this.isCodeIssue = statusCode >= 500 || statusCode === 0 || code === 'ServerError' || code === 'DatabaseError';
  }
}

/**
 * Generic helper to handle fetch responses and typed errors
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

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError(
      'Unable to connect to the backend server. Please verify the server is running on port 5000.',
      0,
      'NetworkConnectionError'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const status = data.statusCode || response.status;
    const errorMsg = data.error || data.message || `Request failed with status ${status}`;
    const code = data.code || `HTTP_${status}`;
    const timestamp = data.timestamp || new Date().toISOString();
    throw new ApiError(errorMsg, status, code, timestamp);
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

// 4. Generate Monthly Payroll (can be for all or scoped to filtered employees)
export async function generateMonthlyPayroll({
  month = 11,
  year = 2026,
  departmentId,
  countryCode,
  level,
  search,
}: {
  month?: number;
  year?: number;
  departmentId?: string;
  countryCode?: string;
  level?: string;
  search?: string;
} = {}): Promise<{ success: boolean; count: number; message: string }> {
  return request('/salaries/generate', {
    method: 'POST',
    body: JSON.stringify({ month, year, departmentId, countryCode, level, search }),
  });
}

// 5. Update / Override an employee's monthly salary components
export async function updateEmployeeSalary(
  employeeId: number,
  payload: { month?: number; year?: number; customAdditions?: Array<{ name: string; amount: number }> }
): Promise<any> {
  const { month = 11, year = 2026, customAdditions = [] } = payload;
  return request(`/salaries/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify({ month, year, customAdditions }),
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

// 6b. Disburse and lock individual settlement for an exiting employee
export async function disburseSettlement(
  employeeId: number,
  { month = 11, year = 2026 }: { month?: number; year?: number } = {}
): Promise<any> {
  return request(`/salaries/settlement/${employeeId}/disburse`, {
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

// 8. Fetch salary cycle metrics & status (DRAFT / PAID / PARTIAL / MIXED / EMPTY)
export async function getSalaryMetrics({
  month = 11,
  year = 2026,
  departmentId,
}: { month?: number; year?: number; departmentId?: string } = {}): Promise<{
  total_eligible: number;
  total_records: number;
  draft_count: number;
  paid_count: number;
  total_gross: number;
  total_net: number;
  status: 'DRAFT' | 'PAID' | 'PARTIAL' | 'MIXED' | 'EMPTY';
}> {
  const query = new URLSearchParams({ month: String(month), year: String(year) });
  if (departmentId) query.append('departmentId', departmentId);
  return request(`/salaries/metrics?${query.toString()}`);
}
