import { BaseModel } from './base.model.js';
import type { SalaryComponentRule } from '../types/index.js';

const RULE_COLUMNS = [
  'id',
  'role_id',
  'country_code',
  'base_percentage',
  'allowance_percentage',
  'bonus_percentage',
  'employer_retirals_percentage',
  'deduction_percentage',
];

export class SalaryComponentRuleModel extends BaseModel<SalaryComponentRule> {
  constructor() {
    super('salary_component_rules', 'id', RULE_COLUMNS);
  }

  /**
   * Find specific policy rule for a role and country
   */
  async findByRoleAndCountry(
    roleId: number,
    countryCode: string
  ): Promise<SalaryComponentRule | null> {
    const rows = await this.find({
      role_id: roleId,
      country_code: countryCode,
    });
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Fetch all rules joining role title, level, and department name
   */
  async findAllWithDetails(): Promise<SalaryComponentRule[]> {
    const sql = `
      SELECT 
        scr.*,
        r.title AS role_title,
        r.level AS role_level,
        d.name AS department_name
      FROM salary_component_rules scr
      JOIN roles r ON scr.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      ORDER BY scr.id ASC
    `;
    return this.raw<SalaryComponentRule>(sql);
  }
}

export const salaryComponentRuleModel = new SalaryComponentRuleModel();
