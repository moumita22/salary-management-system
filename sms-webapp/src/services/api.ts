import type {
  Department,
  Employee,
  PaginatedResponse,
} from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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
  const token = typeof window !== 'undefined' ? localStorage.getItem('sms_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
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
    if (status === 401 && !endpoint.includes('/auth/login') && typeof window !== 'undefined') {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_username');
    }

    const errorMsg = data.error || data.message || `Request failed with status ${status}`;
    const code = data.code || `HTTP_${status}`;
    const timestamp = data.timestamp || new Date().toISOString();
    throw new ApiError(errorMsg, status, code, timestamp);
  }

  return data as T;
}

// ==========================================
// Authentication APIs
// ==========================================

export async function loginUser(
  username: string,
  password: string
): Promise<{ token: string; user: { id: number; username: string; full_name?: string; role: string } }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(
  username: string,
  password: string,
  fullName?: string
): Promise<{ token: string; user: { id: number; username: string; full_name?: string; role: string } }> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, full_name: fullName }),
  });
}

export async function getCurrentUser(): Promise<{
  user: { id: number; username: string; full_name?: string; role: string };
}> {
  return request('/auth/me');
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
  allEmployees?: boolean;
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
  allEmployees = false,
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
  if (allEmployees) params.append('allEmployees', 'true');

  return request<PaginatedResponse<Employee>>(`/employees?${params.toString()}`);
}

// 3. Fetch exiting employees for the Exits & Settlements view
export async function getExitingEmployees({
  month = 11,
  year = 2026,
  status,
}: { month?: number; year?: number; status?: string } = {}): Promise<Employee[]> {
  const queryParams = new URLSearchParams({ month: String(month), year: String(year) });
  if (status && status !== 'ALL') {
    queryParams.set('status', status);
  }
  const res = await request<{ data?: Employee[] } | Employee[]>(
    `/employees/exits?${queryParams.toString()}`
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
): Promise<{ success: boolean; data?: Employee; message?: string }> {
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
): Promise<{ success: boolean; netSalary?: number; grossSalary?: number; message?: string }> {
  return request(`/salaries/settlement/${employeeId}`, {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  });
}

// 6b. Disburse and lock individual settlement for an exiting employee
export async function disburseSettlement(
  employeeId: number,
  { month = 11, year = 2026 }: { month?: number; year?: number } = {}
): Promise<{ success: boolean; message?: string }> {
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

// 9. Create a new employee
export async function createEmployee(
  data: Partial<Employee>
): Promise<{ success: boolean; employee: Employee; message: string }> {
  return request('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 10. Update an existing employee profile
export async function updateEmployee(
  id: number,
  data: Partial<Employee>
): Promise<{ success: boolean; employee: Employee; message: string }> {
  return request(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 11. Fetch roles (optionally filtered by department)
export async function getRoles(departmentId?: string | number): Promise<
  Array<{ id: number; department_id: number; title: string; level: string; department_name?: string }>
> {
  const url = departmentId ? `/roles?departmentId=${departmentId}` : '/roles';
  type RolesResponse =
    | Array<{ id: number; department_id: number; title: string; level: string; department_name?: string }>
    | { data?: Array<{ id: number; department_id: number; title: string; level: string; department_name?: string }> };
  const res = await request<RolesResponse>(url);
  return Array.isArray(res) ? res : res.data || [];
}
