import { Request, Response } from 'express';
import { roleModel } from '../models/roles.model.js';

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : null;
    const roles = departmentId
      ? await roleModel.findByDepartment(departmentId)
      : await roleModel.findAllWithDepartment();
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch roles' });
  }
};

export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = await roleModel.findById(Number(req.params.id));
    if (!role) {
      res.status(404).json({ error: `Role ${req.params.id} not found` });
      return;
    }
    res.json(role);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch role' });
  }
};
