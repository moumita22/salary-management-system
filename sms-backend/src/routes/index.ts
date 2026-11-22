import { Router } from 'express';
import { getDepartments, getDepartmentById } from '../controllers/departments.controller.js';
import { getRoles, getRoleById } from '../controllers/roles.controller.js';
import { getRules, updateRule } from '../controllers/rules.controller.js';
import {
  getEmployees,
  getExitingEmployees,
  getEmployeeById,
} from '../controllers/employees.controller.js';
import {
  generatePayroll,
  disbursePayroll,
  updateSalary,
  generateSettlement,
  getSalaryMetrics,
} from '../controllers/salaries.controller.js';

const router = Router();

// Departments
router.get('/departments', getDepartments);
router.get('/departments/:id', getDepartmentById);

// Roles
router.get('/roles', getRoles);
router.get('/roles/:id', getRoleById);

// Rules
router.get('/rules', getRules);
router.patch('/rules/:id', updateRule);

// Employees (Exits must precede /:id)
router.get('/employees/exits', getExitingEmployees);
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);

// Salaries
router.post('/salaries/generate', generatePayroll);
router.post('/salaries/disburse', disbursePayroll);
router.put('/salaries/:id', updateSalary);
router.post('/salaries/settlement/:id', generateSettlement);
router.get('/salaries/metrics', getSalaryMetrics);

export default router;
