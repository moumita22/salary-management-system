import { Request, Response } from 'express';
import { departmentService } from '../services/department.service.js';
import { formatErrorResponse } from '../types/index.js';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await departmentService.getAllWithHeadcount();
    res.json(departments);
  } catch (error: any) {
    const { status, body } = formatErrorResponse(error, 500, 'DepartmentFetchError');
    res.status(status).json(body);
  }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const dept = await departmentService.getById(req.params.id);
    if (!dept) {
      const { status, body } = formatErrorResponse(
        new Error(`Department '${req.params.id}' not found`),
        404,
        'DepartmentNotFoundError'
      );
      res.status(status).json(body);
      return;
    }
    res.json(dept);
  } catch (error: any) {
    const { status, body } = formatErrorResponse(error, 500, 'DepartmentFetchError');
    res.status(status).json(body);
  }
};
