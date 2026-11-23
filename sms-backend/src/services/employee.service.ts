import { employeeDetailModel, EmployeeDirectoryOptions } from '../models/employee_details.model.js';
import { query } from '../config/db.js';
import { AppError, type EmployeeDetail, type DirectoryEmployee, type PaginationResult } from '../types/index.js';

export class EmployeeService {
  /**
   * High-performance paginated employee directory with active salary and joined role/department data
   */
  async getDirectoryPaginated(
    options: EmployeeDirectoryOptions
  ): Promise<PaginationResult<DirectoryEmployee>> {
    return employeeDetailModel.findDirectoryPaginated(options);
  }

  /**
   * Retrieves complete employee profile with joined role and department by primary key (PK integer id)
   */
  async getEmployeeById(id: number): Promise<DirectoryEmployee | null> {
    return employeeDetailModel.findByIdWithDetails(id);
  }

  /**
   * Retrieves complete employee profile with joined role and department by unique key (UK string employee_id e.g. 'EMP-0001')
   */
  async getEmployeeByCode(employeeCode: string): Promise<DirectoryEmployee | null> {
    return employeeDetailModel.findByCodeWithDetails(employeeCode);
  }

  /**
   * Retrieves employees resigning/exiting within a given payroll cycle
   */
  async getExitingEmployees(
    month: number = 11,
    year: number = 2026
  ): Promise<DirectoryEmployee[]> {
    return employeeDetailModel.findExits(month, year);
  }

  /**
   * Validates and creates a new employee record with defaults and auto-generated EMP-XXXXX ID
   */
  async createEmployee(data: Partial<EmployeeDetail>): Promise<EmployeeDetail> {
    if (!data.first_name || !data.first_name.trim() || !data.last_name || !data.last_name.trim()) {
      throw new AppError('First name and last name are required', 400, 'ValidationError');
    }
    if (!data.email || !data.email.includes('@')) {
      throw new AppError('A valid email address is required', 400, 'ValidationError');
    }
    if (!data.role_id) {
      throw new AppError('Role ID is required', 400, 'ValidationError');
    }
    if (!data.country_code) {
      throw new AppError('Country selection is required', 400, 'ValidationError');
    }
    if (data.annual_ctc === undefined || Number(data.annual_ctc) <= 0) {
      throw new AppError('Annual CTC must be greater than zero', 400, 'ValidationError');
    }

    let empCode = data.employee_id?.trim();
    if (!empCode) {
      const maxIdRes = await query<{ max_id: number }>(
        'SELECT COALESCE(MAX(id), 0) + 1 AS max_id FROM employee_details'
      );
      const nextNum = maxIdRes.rows[0]?.max_id || 1;
      empCode = `EMP-${String(nextNum).padStart(5, '0')}`;
    }

    const payload: Partial<EmployeeDetail> = {
      ...data,
      employee_id: empCode,
      status: data.status || 'ACTIVE',
      annual_ctc: Number(data.annual_ctc),
      date_of_joining: data.date_of_joining || new Date().toISOString().split('T')[0],
      last_working_day: data.last_working_day || null,
    };

    return employeeDetailModel.create(payload);
  }

  /**
   * Updates an existing employee by primary key (PK integer id)
   */
  async updateEmployee(
    id: number,
    data: Partial<EmployeeDetail>
  ): Promise<EmployeeDetail | null> {
    if (data.annual_ctc !== undefined && Number(data.annual_ctc) <= 0) {
      throw new AppError('Annual CTC must be greater than zero', 400, 'ValidationError');
    }
    if (data.email !== undefined && !data.email.includes('@')) {
      throw new AppError('A valid email address is required', 400, 'ValidationError');
    }

    const existing = await employeeDetailModel.findById(id);
    if (!existing) {
      throw new AppError(`Employee with ID ${id} not found`, 404, 'EmployeeNotFoundError');
    }

    await employeeDetailModel.update(id, data);
    return this.getEmployeeById(id);
  }
}

export const employeeService = new EmployeeService();
