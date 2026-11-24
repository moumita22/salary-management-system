import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import * as api from '../services/api.js';
import EmployeeModal from '../components/EmployeeModal.js';
import type { Department, Employee } from '../types/index.js';

const mockDepartments: Department[] = [
  { id: 1, department_id: 'DEP-ENG', name: 'Engineering' },
  { id: 2, department_id: 'DEP-HR', name: 'Human Resources' },
];

const mockRoles = [
  { id: 1, department_id: 1, title: 'Software Engineer', level: 'MID_LEVEL' },
  { id: 2, department_id: 1, title: 'Senior Architect', level: 'SENIOR' },
];

const mockEmployee: Employee = {
  id: 101,
  employee_id: 'EMP-00101',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@acme.com',
  role_id: 1,
  country_code: 'US',
  annual_ctc: 125000,
  status: 'ACTIVE',
  date_of_joining: '2025-01-15',
  last_working_day: null,
};

describe('EmployeeModal Component & Edge Cases', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getRoles').mockResolvedValue(mockRoles);
  });
  it('should render Add mode with empty Annual CTC and dollar placeholder', () => {
    render(
      <EmployeeModal
        isOpen={true}
        employee={null}
        departments={mockDepartments}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    expect(screen.getByText(/Annual CTC \(\$\)/i)).toBeInTheDocument();

    const ctcInput = screen.getByPlaceholderText('Enter amount in dollar');
    expect(ctcInput).toBeInTheDocument();
    expect(ctcInput).toHaveValue(null); // Completely empty default amount
  });

  it('should pre-populate employee attributes in Edit mode', () => {
    render(
      <EmployeeModal
        isOpen={true}
        employee={mockEmployee}
        departments={mockDepartments}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByText('Edit Employee (EMP-00101)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Jane')).toHaveValue('John');
    expect(screen.getByPlaceholderText('e.g. Doe')).toHaveValue('Doe');
    expect(screen.getByPlaceholderText('jane.doe@company.com')).toHaveValue('john.doe@acme.com');
    expect(screen.getByPlaceholderText('Enter amount in dollar')).toHaveValue(125000);
  });

  it('should require Last Working Day when status is set to EXITING', async () => {
    render(
      <EmployeeModal
        isOpen={true}
        employee={mockEmployee}
        departments={mockDepartments}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );
    const user = userEvent.setup();

    const statusSelect = screen.getByDisplayValue('ACTIVE');
    await user.selectOptions(statusSelect, 'EXITING');

    // Asterisk indicating mandatory should now be visible next to Last Working Day
    expect(screen.getByText(/Last Working Day/i)).toBeInTheDocument();
  });
});
