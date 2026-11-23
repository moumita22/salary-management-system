import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller.js';
import { getDepartments, getDepartmentById } from '../controllers/departments.controller.js';
import { getRoles, getRoleById } from '../controllers/roles.controller.js';
import { getRules, updateRule } from '../controllers/rules.controller.js';
import {
  getEmployees,
  getExitingEmployees,
  getEmployeeById,
  getEmployeeByCode,
  createEmployee,
  updateEmployee,
} from '../controllers/employees.controller.js';
import {
  generatePayroll,
  disbursePayroll,
  updateSalary,
  generateSettlement,
  disburseSettlement,
  getSalaryMetrics,
} from '../controllers/salaries.controller.js';
import { authenticateBearer } from '../middleware/index.js';

const router = Router();

// Authentication (Public /login & /register, Protected /me)
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authenticateBearer, getMe);

// Protect all subsequent enterprise endpoints with Bearer token authentication
router.use(authenticateBearer);

// Departments
router.get('/departments', getDepartments);
router.get('/departments/:id', getDepartmentById);

// Roles
router.get('/roles', getRoles);
router.get('/roles/:id', getRoleById);

// Rules
router.get('/rules', getRules);
router.patch('/rules/:id', updateRule);

// Employees (Exits & Code lookups must precede /:id)
router.get('/employees/exits', getExitingEmployees);
router.get('/employees/code/:code', getEmployeeByCode);
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);

// Salaries
router.post('/salaries/generate', generatePayroll);
router.post('/salaries/disburse', disbursePayroll);
router.put('/salaries/:id', updateSalary);
router.post('/salaries/settlement/:id/disburse', disburseSettlement);
router.post('/salaries/settlement/:id', generateSettlement);
router.get('/salaries/metrics', getSalaryMetrics);

export default router;
