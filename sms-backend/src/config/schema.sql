-- schema.sql: ACME Salary Management System Database Schema

-- Drop tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS employee_salary_details CASCADE;
DROP TABLE IF EXISTS employee_details CASCADE;
DROP TABLE IF EXISTS salary_component_rules CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 1. Departments Table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_id VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Roles Table (Department + Seniority Level)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    title VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('JUNIOR', 'MID_LEVEL', 'SENIOR')),
    UNIQUE(department_id, title, level)
);

-- 3. Salary Component Rules (Percentage breakdown per role and country)
CREATE TABLE salary_component_rules (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    country_code VARCHAR(10) NOT NULL,
    base_percentage NUMERIC(5, 2) NOT NULL,
    allowance_percentage NUMERIC(5, 2) NOT NULL,
    bonus_percentage NUMERIC(5, 2) NOT NULL,
    employer_retirals_percentage NUMERIC(5, 2) NOT NULL,
    deduction_percentage NUMERIC(5, 2) NOT NULL,
    UNIQUE(role_id, country_code),
    CONSTRAINT chk_ctc_percentage_sum 
        CHECK ((base_percentage + allowance_percentage + bonus_percentage + employer_retirals_percentage) = 100.00),
    CONSTRAINT chk_valid_deduction 
        CHECK (deduction_percentage >= 0.00 AND deduction_percentage <= 50.00)
);

-- 4. Employee Details Table
CREATE TABLE employee_details (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    country_code VARCHAR(10) NOT NULL,
    annual_ctc NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXITING', 'TERMINATED')),
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    last_working_day DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Employee Salary Details Table (Monthly financial snapshot in USD)
CREATE TABLE employee_salary_details (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employee_details(id) ON DELETE CASCADE,
    payout_month INT NOT NULL CHECK (payout_month BETWEEN 1 AND 12),
    payout_year INT NOT NULL,
    base_salary NUMERIC(14, 2) NOT NULL,
    allowance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    bonus NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    added_bonus NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    employer_retirals NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    gross_salary NUMERIC(14, 2) NOT NULL,
    tax_deduction NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(14, 2) NOT NULL,
    calculation_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PAID')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, payout_year, payout_month)
);

-- High-Performance B-Tree Indexes for 10,000 Employees
CREATE INDEX IF NOT EXISTS idx_roles_dept_id ON roles(department_id);
CREATE INDEX IF NOT EXISTS idx_rules_role_country_code ON salary_component_rules(role_id, country_code);
CREATE INDEX IF NOT EXISTS idx_emp_role_id ON employee_details(role_id);
CREATE INDEX IF NOT EXISTS idx_emp_country_code ON employee_details(country_code);
CREATE INDEX IF NOT EXISTS idx_emp_status ON employee_details(status);
CREATE INDEX IF NOT EXISTS idx_emp_lwd ON employee_details(last_working_day);
CREATE INDEX IF NOT EXISTS idx_emp_name ON employee_details(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_emp_email ON employee_details(email);

CREATE INDEX IF NOT EXISTS idx_sal_emp_id ON employee_salary_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_sal_period ON employee_salary_details(payout_year, payout_month);
CREATE INDEX IF NOT EXISTS idx_sal_status ON employee_salary_details(status);
CREATE INDEX IF NOT EXISTS idx_sal_net ON employee_salary_details(net_salary);
