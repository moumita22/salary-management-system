import { employeeDetailModel, EmployeeDirectoryOptions } from '../models/employee_details.model.js';
import type { EmployeeDetail, DirectoryEmployee, PaginationResult } from '../types/index.js';

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
   * Validates and creates a new employee record with defaults
   */
  async createEmployee(data: Partial<EmployeeDetail>): Promise<EmployeeDetail> {
    if (!data.first_name || !data.last_name) {
      throw new Error('First name and last name are required');
    }
    if (!data.email || !data.email.includes('@')) {
      throw new Error('A valid email address is required');
    }
    if (!data.role_id) {
      throw new Error('Role ID is required');
    }
    if (!data.country_code) {
      throw new Error('Country code is required');
    }
    if (data.annual_ctc === undefined || Number(data.annual_ctc) <= 0) {
      throw new Error('Annual CTC must be greater than zero');
    }

    const payload: Partial<EmployeeDetail> = {
      ...data,
      status: data.status || 'ACTIVE',
      annual_ctc: Number(data.annual_ctc),
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
    return employeeDetailModel.update(id, data);
  }
}

export const employeeService = new EmployeeService();
