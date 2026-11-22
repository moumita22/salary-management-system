import { Request, Response } from 'express';
import { salaryComponentRuleModel } from '../models/salary_component_rules.model.js';
import { salaryCalculatorService } from '../services/salaryCalculator.service.js';

export const getRules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rules = await salaryComponentRuleModel.findAllWithDetails();
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch rules' });
  }
};

export const updateRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await salaryComponentRuleModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: `Rule ${id} not found` });
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
  } catch (error: any) {
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message || 'Failed to update rule' });
  }
};
