import { Request, Response } from 'express';
import { salaryComponentRuleModel } from '../models/salary_component_rules.model.js';
import { salaryCalculatorService } from '../services/salaryCalculator.service.js';
import { formatErrorResponse } from '../types/index.js';

export const getRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const { countryCode, roleId } = req.query;
    const rules = await salaryComponentRuleModel.findAllWithDetails({
      countryCode: countryCode ? String(countryCode) : undefined,
      roleId: roleId ? Number(roleId) : undefined,
    });
    res.json(rules);
  } catch (error: unknown) {
    const { status, body } = formatErrorResponse(error, 500, 'RuleFetchError');
    res.status(status).json(body);
  }
};

export const updateRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await salaryComponentRuleModel.findById(id);
    if (!existing) {
      const { status, body } = formatErrorResponse(
        new Error(`Rule ${id} not found`),
        404,
        'RuleNotFoundError'
      );
      res.status(status).json(body);
      return;
    }

    const payload = {
      base_percentage: req.body.base_percentage ?? existing.base_percentage,
      allowance_percentage: req.body.allowance_percentage ?? existing.allowance_percentage,
      bonus_percentage: req.body.bonus_percentage ?? existing.bonus_percentage,
      employer_retirals_percentage: req.body.employer_retirals_percentage ?? existing.employer_retirals_percentage,
      deduction_percentage: req.body.deduction_percentage ?? existing.deduction_percentage,
    };

    // Enforce 100% Policy Rule constraint
    salaryCalculatorService.validateRulePercentages(payload);

    const updated = await salaryComponentRuleModel.update(id, payload);
    res.json(updated);
  } catch (error: unknown) {
    const { status, body } = formatErrorResponse(error, 400, 'RuleUpdateError');
    res.status(status).json(body);
  }
};
