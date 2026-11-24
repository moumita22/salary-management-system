import { departmentModel } from '../models/departments.model.js';
import type { Department, DepartmentWithHeadcount } from '../types/index.js';

export class DepartmentService {
  async getAllWithHeadcount(): Promise<DepartmentWithHeadcount[]> {
    return departmentModel.getWithHeadcount();
  }

  async getById(id: number | string): Promise<Department | null> {
    return departmentModel.findByIdOrCode(id);
  }

  async getByCode(code: string): Promise<Department | null> {
    return departmentModel.findByCode(code);
  }

  async getByName(name: string): Promise<Department | null> {
    return departmentModel.findByName(name);
  }

  async create(data: { department_id: string; name: string }): Promise<Department> {
    return departmentModel.create(data);
  }
}

export const departmentService = new DepartmentService();
