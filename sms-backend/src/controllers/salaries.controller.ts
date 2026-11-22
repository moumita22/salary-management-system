import { Request, Response } from 'express';
import { payrollService } from '../services/payroll.service.js';
import { employeeSalaryDetailModel } from '../models/employee_salary_details.model.js';

export const generatePayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const month = parseInt(String(req.body.month || 11), 10);
    const year = parseInt(String(req.body.year || 2026), 10);
    const { departmentId, countryCode, level, search } = req.body;

    const result = await payrollService.generateMonthlyPayroll(month, year, {
      departmentId,
      countryCode,
      level,
      search,
    });
    res.json({
      success: true,
      count: result.generatedCount,
      durationMs: result.durationMs,
      message: `Generated payroll for ${result.generatedCount.toLocaleString()} employees in ${(result.durationMs / 1000).toFixed(2)}s.`,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to generate payroll' });
  }
};

export const disbursePayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const month = parseInt(String(req.body.month || 11), 10);
    const year = parseInt(String(req.body.year || 2026), 10);

    const result = await payrollService.disbursePayroll(month, year);
    res.json({
      success: true,
      disbursedCount: result.lockedCount,
      message: `Disbursed and locked ${result.lockedCount.toLocaleString()} employee records for ${month}/${year}.`,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to disburse payroll' });
  }
};

export const updateSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);
    const { month = 11, year = 2026, overrides = {}, customAdditions = [] } = req.body;

    const updated = await payrollService.adjustEmployeeSalary(
      employeeId,
      month,
      year,
      overrides,
      customAdditions
    );
    res.json(updated);
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to update salary' });
  }
};

export const generateSettlement = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);
    const month = parseInt(String(req.body.month || 11), 10);
    const year = parseInt(String(req.body.year || 2026), 10);

    const settlement = await payrollService.generateSettlement(employeeId, month, year);
    res.json(settlement);
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to generate settlement' });
  }
};

export const getSalaryMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const month = parseInt(String(req.query.month || 11), 10);
    const year = parseInt(String(req.query.year || 2026), 10);

    const metrics = await employeeSalaryDetailModel.getCycleMetrics(month, year);
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch salary metrics' });
  }
};
