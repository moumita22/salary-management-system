import { Request, Response } from 'express';
import { payrollService } from '../services/payroll.service.js';
import { employeeSalaryDetailModel } from '../models/employee_salary_details.model.js';
import { formatErrorResponse } from '../types/index.js';

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
    const { status, body } = formatErrorResponse(error, 500, 'PayrollGenerationError');
    res.status(status).json(body);
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
    const { status, body } = formatErrorResponse(error, 500, 'PayrollDisbursementError');
    res.status(status).json(body);
  }
};

export const updateSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);
    const { month = 11, year = 2026, customAdditions = [] } = req.body;

    const updated = await payrollService.adjustEmployeeSalary(
      employeeId,
      Number(month),
      Number(year),
      customAdditions
    );
    res.json(updated);
  } catch (error: any) {
    const { status, body } = formatErrorResponse(error, 400, 'SalaryAdjustmentError');
    res.status(status).json(body);
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
    const { status, body } = formatErrorResponse(error, 400, 'SettlementGenerationError');
    res.status(status).json(body);
  }
};

export const disburseSettlement = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);
    const month = parseInt(String(req.body.month || 11), 10);
    const year = parseInt(String(req.body.year || 2026), 10);

    const result = await payrollService.disburseIndividualSettlement(employeeId, month, year);
    res.json({
      success: true,
      data: result,
      message: `Settlement disbursed and locked for employee ${employeeId}.`,
    });
  } catch (error: any) {
    const { status, body } = formatErrorResponse(error, 400, 'SettlementDisbursementError');
    res.status(status).json(body);
  }
};

export const getSalaryMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const month = parseInt(String(req.query.month || 11), 10);
    const year = parseInt(String(req.query.year || 2026), 10);
    const departmentId = req.query.departmentId ? String(req.query.departmentId) : undefined;

    const metrics = await employeeSalaryDetailModel.getCycleMetrics(month, year, departmentId);
    res.json(metrics);
  } catch (error: any) {
    const { status, body } = formatErrorResponse(error, 500, 'SalaryMetricsError');
    res.status(status).json(body);
  }
};
