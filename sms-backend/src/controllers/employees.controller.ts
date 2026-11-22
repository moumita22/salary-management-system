import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service.js';

export const getEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '25',
      departmentId,
      countryCode,
      level,
      search,
      status,
      month = '11',
      year = '2026',
      sortField,
      sortOrder,
    } = req.query;

    const result = await employeeService.getDirectoryPaginated({
      page: parseInt(String(page), 10) || 1,
      limit: parseInt(String(limit), 10) || 25,
      departmentId: departmentId ? String(departmentId) : undefined,
      countryCode: countryCode ? String(countryCode) : undefined,
      level: level ? String(level) : undefined,
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      month: parseInt(String(month), 10) || 11,
      year: parseInt(String(year), 10) || 2026,
      sortField: sortField ? String(sortField) : undefined,
      sortOrder: sortOrder === 'DESC' ? 'DESC' : 'ASC',
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch employees' });
  }
};

export const getExitingEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const month = parseInt(String(req.query.month || '11'), 10);
    const year = parseInt(String(req.query.year || '2026'), 10);
    const exits = await employeeService.getExitingEmployees(month, year);
    res.json(exits);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch exiting employees' });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const emp = await employeeService.getEmployeeById(Number(req.params.id));
    if (!emp) {
      res.status(404).json({ error: `Employee ${req.params.id} not found` });
      return;
    }
    res.json(emp);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch employee' });
  }
};
