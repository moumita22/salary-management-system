import { Request, Response } from 'express';
import { roleModel } from '../models/roles.model.js';
import { formatErrorResponse } from '../types/index.js';

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const departmentId = req.query.departmentId ? String(req.query.departmentId).trim() : undefined;
    const roles = departmentId
      ? await roleModel.findByDepartment(departmentId)
      : await roleModel.findAllWithDepartment();
    res.json(roles);
  } catch (error: any) {
    const { status, body } = formatErrorResponse(error, 500, 'RoleFetchError');
    res.status(status).json(body);
  }
};

export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = await roleModel.findById(Number(req.params.id));
    if (!role) {
      const { status, body } = formatErrorResponse(
        new Error(`Role ${req.params.id} not found`),
        404,
        'RoleNotFoundError'
      );
      res.status(status).json(body);
      return;
    }
    res.json(role);
  } catch (error: any) {
    const { status, body } = formatErrorResponse(error, 500, 'RoleFetchError');
    res.status(status).json(body);
  }
};
