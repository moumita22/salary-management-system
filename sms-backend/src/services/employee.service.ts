import { employeeDetailModel, EmployeeDirectoryOptions } from '../models/employee_details.model.js';
import type { EmployeeDetail } from '../types/index.js';

export class EmployeeService {
  async getDirectoryPaginated(options: EmployeeDirectoryOptions) {
    return employeeDetailModel.findDirectoryPaginated(options);
  }

  async getEmployeeById(id: number | string): Promise<EmployeeDetail | null> {
    return employeeDetailModel.findById(id);
  }

  async getExitingEmployees(month: number = 11, year: number = 2026) {
    return employeeDetailModel.findExits(month, year);
  }

  async createEmployee(data: Partial<EmployeeDetail>) {
    return employeeDetailModel.create(data);
  }

  async updateEmployee(id: number | string, data: Partial<EmployeeDetail>) {
    return employeeDetailModel.update(id, data);
  }
}

export const employeeService = new EmployeeService();
