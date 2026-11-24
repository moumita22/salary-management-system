import { BaseModel } from './base.model.js';
import type { SalaryComponentRule, QueryParam } from '../types/index.js';

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

export interface RuleFilterOptions {
  countryCode?: string;
  roleId?: number;
}

export class SalaryComponentRuleModel extends BaseModel<SalaryComponentRule> {
  constructor() {
    super('salary_component_rules', 'id', RULE_COLUMNS);
  }

  /**
   * Find rule by primary key id, with float casting and joined role and department info
   */
  override async findById(id: number | string): Promise<SalaryComponentRule | null> {
    const sql = `
      SELECT 
        scr.id,
        scr.role_id,
        scr.country_code,
        scr.base_percentage::float AS base_percentage,
        scr.allowance_percentage::float AS allowance_percentage,
        scr.bonus_percentage::float AS bonus_percentage,
        scr.employer_retirals_percentage::float AS employer_retirals_percentage,
        scr.deduction_percentage::float AS deduction_percentage,
        r.title AS role_title,
        r.level AS role_level,
        d.name AS department_name
      FROM salary_component_rules scr
      JOIN roles r ON scr.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE scr.id = $1
      LIMIT 1
    `;
    const rows = await this.raw<SalaryComponentRule>(sql, [Number(id)]);
    return rows[0] ?? null;
  }

  /**
   * Update rule and return the updated record with joined role and department info
   */
  override async update(
    id: number | string,
    data: Partial<SalaryComponentRule>
  ): Promise<SalaryComponentRule | null> {
    await super.update(id, data);
    return this.findById(id);
  }

  /**
   * Find specific policy rule for a role and country, with joined role and department info
   */
  async findByRoleAndCountry(
    roleId: number,
    countryCode: string
  ): Promise<SalaryComponentRule | null> {
    const normalizedCountry = countryCode.trim().toUpperCase();
    const sql = `
      SELECT 
        scr.id,
        scr.role_id,
        scr.country_code,
        scr.base_percentage::float AS base_percentage,
        scr.allowance_percentage::float AS allowance_percentage,
        scr.bonus_percentage::float AS bonus_percentage,
        scr.employer_retirals_percentage::float AS employer_retirals_percentage,
        scr.deduction_percentage::float AS deduction_percentage,
        r.title AS role_title,
        r.level AS role_level,
        d.name AS department_name
      FROM salary_component_rules scr
      JOIN roles r ON scr.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      WHERE scr.role_id = $1 AND UPPER(scr.country_code) = $2
      LIMIT 1
    `;
    const rows = await this.raw<SalaryComponentRule>(sql, [roleId, normalizedCountry]);
    return rows[0] ?? null;
  }

  /**
   * Fetch rules with joined role title, level, and department name, plus optional country/role filtering
   */
  async findAllWithDetails(filters: RuleFilterOptions = {}): Promise<SalaryComponentRule[]> {
    const conditions: string[] = [];
    const values: QueryParam[] = [];
    let pIdx = 1;

    if (filters.countryCode && filters.countryCode.trim()) {
      conditions.push(`UPPER(scr.country_code) = $${pIdx++}`);
      values.push(filters.countryCode.trim().toUpperCase());
    }

    if (filters.roleId) {
      conditions.push(`scr.role_id = $${pIdx++}`);
      values.push(Number(filters.roleId));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        scr.id,
        scr.role_id,
        scr.country_code,
        scr.base_percentage::float AS base_percentage,
        scr.allowance_percentage::float AS allowance_percentage,
        scr.bonus_percentage::float AS bonus_percentage,
        scr.employer_retirals_percentage::float AS employer_retirals_percentage,
        scr.deduction_percentage::float AS deduction_percentage,
        r.title AS role_title,
        r.level AS role_level,
        d.name AS department_name
      FROM salary_component_rules scr
      JOIN roles r ON scr.role_id = r.id
      JOIN departments d ON r.department_id = d.id
      ${whereClause}
      ORDER BY scr.id ASC
    `;
    return this.raw<SalaryComponentRule>(sql, values);
  }
}

export const salaryComponentRuleModel = new SalaryComponentRuleModel();

