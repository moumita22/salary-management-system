import { Request, Response } from 'express';
import { departmentService } from '../services/department.service.js';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await departmentService.getAllWithHeadcount();
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch departments' });
  }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const dept = await departmentService.getById(req.params.id);
    if (!dept) {
      res.status(404).json({ error: `Department ${req.params.id} not found` });
      return;
    }
    res.json(dept);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch department' });
  }
};
