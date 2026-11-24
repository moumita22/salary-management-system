# ACME Corporation — Automated Test Suite & Verification Document

**Document Version:** 2.0.0  
**Generated Date:** November 24, 2026  
**Repository Branch:** `test/salary-management`  
**Total Tests:** **41 / 41 Tests Passing (100% Pass Rate)**  
**Backend Tests:** **29 / 29 Passed (0 Failures, 102 Assertions, 417ms)**  
**Frontend Tests:** **12 / 12 Passed (0 Failures, 5.30s)**  
**Machine-Readable JSON Exports:**  
- [backend-test-results.json](file:///D:/work/sms/backend-test-results.json)  
- [sms-webapp/.vitest/json/output.json](file:///D:/work/sms/sms-webapp/.vitest/json/output.json)

---

## 1. Executive Summary & Test Metrics Dashboard

This document details the automated unit, integration, and security test suites for the ACME Corporation Salary Management System (SMS). It prioritizes the **Node.js / Bun backend test cases**, detailing all 29 unit tests from the very first one in structured **JSON specifications** with their **live real-time execution logs**.

### Overall Test Execution Metrics

| Layer | Runner / Tool | Target Test Suites | Total Tests | Passed | Failed | Duration | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Backend API & Core Services** | Bun Test v1.4.4 | `sms-backend/tests/financials.test.ts` (10 Suites) | 29 | 29 | 0 | 417ms | **100% PASS** |
| **Frontend Web Application** | Vitest v5.1.1 + React Testing Library | `sms-webapp/src/test/` (3 Suites) | 12 | 12 | 0 | 5.30s | **100% PASS** |
| **Linter / Static Analysis** | Oxlint v0.15.11 | Frontend & Backend TypeScript codebase | 33 files | 33 | 0 | 76ms | **0 ERRORS** |
| **Production Build** | Vite v8.3.8 | Client bundle compilation & tree shaking | 2159 modules | Complete | 0 | 993ms | **CLEAN** |

### Verified Code Coverage Metrics

#### Backend Code Coverage (`bun test --coverage`)
- **Overall Functions Coverage:** `62.48%`
- **Overall Lines Coverage:** `63.34%`

| File | % Functions | % Lines | Critical Logic / Domain Area |
| :--- | :---: | :---: | :--- |
| `src/types/index.ts` | **100.00%** | **100.00%** | Standardized error contracts and custom `AppError` types |
| `src/utils/index.ts` | **100.00%** | **100.00%** | Core utility re-exports |
| `src/utils/currency.ts` | **100.00%** | **95.28%** | Integer cent math, precision conversion, earnings reconciliation |
| `src/models/admin_users.model.ts` | **100.00%** | **94.44%** | Admin user security queries and role assignments |
| `src/services/auth.service.ts` | **100.00%** | **93.64%** | PBKDF2 authentication, token issuance, constant-time validation |
| `src/services/employee.service.ts` | **83.33%** | **89.09%** | Employee CRUD, validations, sequential IDs, exit cycle linking |
| `src/models/employee_details.model.ts` | **57.14%** | **81.69%** | Directory pagination, multi-field search concatenation |
| `src/utils/dates.ts` | **66.67%** | **72.22%** | Dynamic calendar days and leap year date math |
| `src/models/departments.model.ts` | **40.00%** | **47.83%** | Department lookup routing (numeric ID vs string code) |
| `src/models/base.model.ts` | **83.33%** | **42.37%** | Column allowlist guards and SQL injection mitigation |
| `src/services/salaryCalculator.service.ts` | **33.33%** | **34.52%** | 100% rule validation and join/exit proration logic |
| `src/models/salary_component_rules.model.ts` | **20.00%** | **33.33%** | Salary rule components model |
| `src/config/db.ts` | **20.00%** | **43.94%** | SQLite connection pool lifecycle |

#### Frontend Code Coverage (Vitest v8 Coverage)
- **Overall Statements:** `47.91%`
- **Overall Branches:** `34.32%`
- **Overall Functions:** `47.05%`
- **Overall Lines:** `48.51%`

| Component / Module | % Stmts | % Branch | % Funcs | % Lines | Critical Feature / Test Area |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `components/ProtectedRoute.tsx` | **100.00%** | **100.00%** | **100.00%** | **100.00%** | Unauthenticated redirect to `/login` and route guarding |
| `pages/LoginPage.tsx` | **74.13%** | **66.66%** | **80.00%** | **75.00%** | Password eye toggle, tab switching, form validation |
| `components/EmployeeModal.tsx` | **59.81%** | **46.80%** | **50.00%** | **59.80%** | Dollar CTC placeholder, edit mode prefill, exit date validation |
| `context/AuthContext.tsx` | **45.28%** | **28.57%** | **66.66%** | **42.00%** | Client authentication state, login, logout lifecycle |

---

## 2. Backend Unit Test Cases & Real-Time Output (Starting From TC-01)

Source Test File: [`sms-backend/tests/financials.test.ts`](file:///D:/work/sms/sms-backend/tests/financials.test.ts)  
Dedicated JSON Data: [`backend-test-results.json`](file:///D:/work/sms/backend-test-results.json)

---

### Suite 1: Financial Math & Currency Utilities (Integer Cents)
*Location: lines 13–146 in financials.test.ts*  
*Objective: Guarantee that financial computations operate on integer cents to avoid IEEE 754 precision drift, reconcile gross with net earnings, and handle variable calendar length exit and joining proration.*

#### TC-BE-001: Dollar to Cents & Reconstitution
```json
{
  "testId": "TC-BE-001",
  "name": "should accurately convert dollars to cents and back without float drift",
  "suite": "Financial Math & Currency Utilities (Integer Cents)",
  "targetEdgeCase": "IEEE 754 floating point drift during monetary multiplication and division (e.g. 100.55 * 100)",
  "input": {
    "toCentsInputs": [100.55, "2500.00"],
    "toDollarsInputs": [10055]
  },
  "expectedOutput": {
    "toCents(100.55)": 10055,
    "toDollars(10055)": 100.55,
    "toCents('2500.00')": 250000
  },
  "assertionsCount": 3,
  "status": "PASSED",
  "durationMs": 0.85,
  "realtimeOutput": "(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately convert dollars to cents and back without float drift [0.85ms]"
}
```

#### TC-BE-002: Full-Month Standard Salary & Reconciled Earnings
```json
{
  "testId": "TC-BE-002",
  "name": "should calculate standard full-month salary and guarantee exact reconciliation",
  "suite": "Financial Math & Currency Utilities (Integer Cents)",
  "targetEdgeCase": "Ensuring Gross exactly equals Net plus Deductions and component splits total 100% without 1-cent off discrepancies",
  "input": {
    "annualCtc": 120000,
    "rule": {
      "base_percentage": 50.0,
      "allowance_percentage": 25.0,
      "bonus_percentage": 15.0,
      "employer_retirals_percentage": 10.0,
      "deduction_percentage": 12.0
    }
  },
  "expectedOutput": {
    "monthly_ctc": 10000.0,
    "base_salary": 5000.0,
    "allowance": 2500.0,
    "bonus": 1500.0,
    "employer_retirals": 1000.0,
    "gross_salary": 9000.0,
    "tax_deduction": 1080.0,
    "net_salary": 7920.0,
    "grossReconciliation": "gross_salary === base_salary + allowance + bonus",
    "netReconciliation": "net_salary === gross_salary - tax_deduction"
  },
  "assertionsCount": 8,
  "status": "PASSED",
  "durationMs": 0.13,
  "realtimeOutput": "(pass) Financial Math & Currency Utilities (Integer Cents) > should calculate standard full-month salary and guarantee exact reconciliation [0.13ms]"
}
```

#### TC-BE-003: Dynamic Calendar Days Exit Proration
```json
{
  "testId": "TC-BE-003",
  "name": "should accurately calculate mid-month exit proration using dynamic calendar days",
  "suite": "Financial Math & Currency Utilities (Integer Cents)",
  "targetEdgeCase": "Dynamic month length divisor (November has 30 days; exit on 20th = 20/30 days worked) and Date object interoperability",
  "input": {
    "annualCtc": 120000,
    "month": 11,
    "year": 2026,
    "exitDateString": "2026-11-20",
    "exitDateObject": "2026-11-20T00:00:00.000Z"
  },
  "expectedOutput": {
    "is_prorated": true,
    "total_working_days": 30,
    "actual_days_worked": 20,
    "gross_salary": 6000.0,
    "tax_deduction": 720.0,
    "net_salary": 5280.0,
    "dateObjectWorkedDays": 20,
    "dateObjectGrossSalary": 6000.0
  },
  "assertionsCount": 8,
  "status": "PASSED",
  "durationMs": 0.58,
  "realtimeOutput": "(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately calculate mid-month exit proration using dynamic calendar days [0.58ms]"
}
```

#### TC-BE-004: February 28-Day Non-Leap Year Proration
```json
{
  "testId": "TC-BE-004",
  "name": "should accurately prorate February (28 days in non-leap year)",
  "suite": "Financial Math & Currency Utilities (Integer Cents)",
  "targetEdgeCase": "Correct divisor detection for non-leap year February (28 days divisor instead of default 30 or 31)",
  "input": {
    "annualCtc": 120000,
    "month": 2,
    "year": 2025,
    "exitDate": "2025-02-14"
  },
  "expectedOutput": {
    "total_working_days": 28,
    "actual_days_worked": 14,
    "gross_salary": 4500.0,
    "prorationFraction": "14 / 28 = 50.00%"
  },
  "assertionsCount": 3,
  "status": "PASSED",
  "durationMs": 0.04,
  "realtimeOutput": "(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately prorate February (28 days in non-leap year) [0.04ms]"
}
```

#### TC-BE-005: Mid-Month Join Proration (31-Day Month)
```json
{
  "testId": "TC-BE-005",
  "name": "should accurately prorate mid-month joining for an employee joining on Oct 15 (31-day month)",
  "suite": "Financial Math & Currency Utilities (Integer Cents)",
  "targetEdgeCase": "New hire proration on 31-day month: days worked = (31 - 15 + 1) = 17 days worked out of 31",
  "input": {
    "annualCtc": 120000,
    "month": 10,
    "year": 2026,
    "joiningDate": "2026-10-15"
  },
  "expectedOutput": {
    "is_prorated": true,
    "total_working_days": 31,
    "actual_days_worked": 17,
    "base_salary": 2741.94,
    "gross_salary": "round(base + allowance + bonus) = reconciled",
    "net_salary": "round(gross - tax_deduction) = reconciled"
  },
  "assertionsCount": 5,
  "status": "PASSED",
  "durationMs": 9.97,
  "realtimeOutput": "(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately prorate mid-month joining for an employee joining on Oct 15 (31-day month) [9.97ms]"
}
```

#### TC-BE-006: Manual Overrides & Contractual Bonus Separation
```json
{
  "testId": "TC-BE-006",
  "name": "should accurately calculate manual overrides with added bonus while keeping contractual bonus distinct",
  "suite": "Financial Math & Currency Utilities (Integer Cents)",
  "targetEdgeCase": "Ensuring one-off manual performance bonus does not mutate baseline contractual bonus in database snapshots",
  "input": {
    "base_salary": 5000.0,
    "allowance": 2500.0,
    "contractual_bonus": 1500.0,
    "deduction_percentage": 10.0,
    "added_bonus": 500.0
  },
  "expectedOutput": {
    "base_salary": 5000.0,
    "allowance": 2500.0,
    "bonus": 1500.0,
    "added_bonus": 500.0,
    "gross_salary": 9500.0,
    "tax_deduction": 950.0,
    "net_salary": 8550.0
  },
  "assertionsCount": 7,
  "status": "PASSED",
  "durationMs": 0.14,
  "realtimeOutput": "(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately calculate manual overrides with added bonus while keeping contractual bonus distinct [0.14ms]"
}
```

---

### Suite 2: SalaryCalculatorService Rule Validation
*Location: lines 148–174 in financials.test.ts*  
*Objective: Enforce that all component rule percentages sum strictly to 100.00%.*

#### TC-BE-007: Rule Percentage Exactly 100%
```json
{
  "testId": "TC-BE-007",
  "name": "should succeed when rule percentages sum to exactly 100%",
  "suite": "SalaryCalculatorService Rule Validation",
  "targetEdgeCase": "Valid rule configuration passing validation",
  "input": {
    "base_percentage": 55.0,
    "allowance_percentage": 25.0,
    "bonus_percentage": 10.0,
    "employer_retirals_percentage": 10.0,
    "deduction_percentage": 8.0
  },
  "expectedOutput": {
    "isValid": true,
    "throws": false
  },
  "assertionsCount": 1,
  "status": "PASSED",
  "durationMs": 0.98,
  "realtimeOutput": "(pass) SalaryCalculatorService Rule Validation > should succeed when rule percentages sum to exactly 100% [0.98ms]"
}
```

#### TC-BE-008: Reject Rule Percentages Not Summing to 100%
```json
{
  "testId": "TC-BE-008",
  "name": "should throw an error when rule percentages do not sum to 100%",
  "suite": "SalaryCalculatorService Rule Validation",
  "targetEdgeCase": "Preventing rule misconfiguration (e.g. sum = 105%) that would lead to corporate financial imbalances",
  "input": {
    "base_percentage": 60.0,
    "allowance_percentage": 25.0,
    "bonus_percentage": 10.0,
    "employer_retirals_percentage": 10.0
  },
  "expectedOutput": {
    "throws": true,
    "errorMessage": "/must equal exactly 100.00%/"
  },
  "assertionsCount": 1,
  "status": "PASSED",
  "durationMs": 1.51,
  "realtimeOutput": "(pass) SalaryCalculatorService Rule Validation > should throw an error when rule percentages do not sum to 100% [1.51ms]"
}
```

---

### Suite 3: Financial Immutability Guard
*Location: lines 176–195 in financials.test.ts*  
*Objective: Guarantee historical integrity of finalized and paid payroll cycles.*

#### TC-BE-009: Allow Operations on `DRAFT` Records
```json
{
  "testId": "TC-BE-009",
  "name": "should allow operations on DRAFT records",
  "suite": "Financial Immutability Guard",
  "targetEdgeCase": "Permitting modifications and adjustments when payroll is still in draft",
  "input": {
    "status": "DRAFT"
  },
  "expectedOutput": {
    "throws": false
  },
  "assertionsCount": 1,
  "status": "PASSED",
  "durationMs": 0.06,
  "realtimeOutput": "(pass) Financial Immutability Guard > should allow operations on DRAFT records [0.06ms]"
}
```

#### TC-BE-010: Reject Operations on `PAID` Records (403 Forbidden)
```json
{
  "testId": "TC-BE-010",
  "name": "should reject operations on PAID records with 403 Forbidden",
  "suite": "Financial Immutability Guard",
  "targetEdgeCase": "Strict prohibition against retroactively editing disbursed payments",
  "input": {
    "status": "PAID"
  },
  "expectedOutput": {
    "statusCode": 403,
    "errorName": "FinancialLockError",
    "errorMessage": "Financial Immutability Violation"
  },
  "assertionsCount": 3,
  "status": "PASSED",
  "durationMs": 0.67,
  "realtimeOutput": "(pass) Financial Immutability Guard > should reject operations on PAID records with 403 Forbidden [0.67ms]"
}
```

---

### Suite 4: BaseModel Security: Column Allowlist Guard
*Location: lines 197–225 in financials.test.ts*  
*Objective: Eliminate SQL injection vulnerabilities in dynamic database query builders.*

#### TC-BE-011: Allow Valid Registered Columns
```json
{
  "testId": "TC-BE-011",
  "name": "should allow valid registered columns",
  "suite": "BaseModel Security: Column Allowlist Guard",
  "targetEdgeCase": "Accepting legitimate table columns registered on the model",
  "input": {
    "columns": ["id", "name", "email"]
  },
  "expectedOutput": {
    "allowed": ["id", "name", "email"]
  },
  "assertionsCount": 3,
  "status": "PASSED",
  "durationMs": 0.06,
  "realtimeOutput": "(pass) BaseModel Security: Column Allowlist Guard > should allow valid registered columns [0.06ms]"
}
```

#### TC-BE-012: Reject SQL Injection & Unauthorized Columns
```json
{
  "testId": "TC-BE-012",
  "name": "should reject unauthorized or arbitrary SQL injection columns",
  "suite": "BaseModel Security: Column Allowlist Guard",
  "targetEdgeCase": "Rejecting raw SQL statement chains and unlisted schema fields",
  "input": {
    "maliciousKeys": [
      "salary; DROP TABLE users;--",
      "password_hash"
    ]
  },
  "expectedOutput": {
    "throws": true,
    "errorPattern": "/Unauthorized column access/"
  },
  "assertionsCount": 2,
  "status": "PASSED",
  "durationMs": 0.05,
  "realtimeOutput": "(pass) BaseModel Security: Column Allowlist Guard > should reject unauthorized or arbitrary SQL injection columns [0.05ms]"
}
```

---

### Suite 5: DepartmentModel & Service Validation
*Location: lines 227–268 in financials.test.ts*  
*Objective: Accurately dispatch polymorphic query lookups by integer primary key or formatted code.*

#### TC-BE-013: Resolve Numeric IDs vs Department Codes
```json
{
  "testId": "TC-BE-013",
  "name": "should correctly distinguish between numeric IDs and department codes in findByIdOrCode",
  "suite": "DepartmentModel & Service Validation",
  "targetEdgeCase": "Differentiating numeric string '2' from department code string 'DEP-01' or 'dep-02'",
  "input": {
    "queries": [1, "2", "DEP-01", "dep-02"]
  },
  "expectedOutput": {
    "routedToFindById": [1, 2],
    "routedToFindByCode": ["DEP-01", "dep-02"]
  },
  "assertionsCount": 4,
  "status": "PASSED",
  "durationMs": 1.47,
  "realtimeOutput": "(pass) DepartmentModel & Service Validation > should correctly distinguish between numeric IDs and department codes in findByIdOrCode [1.47ms]"
}
```

---

### Suite 6: EmployeeDetailModel & Service Separation (PK vs UK)
*Location: lines 270–343 in financials.test.ts*  
*Objective: Guarantee clean separation between internal surrogate integer PKs and business employee codes.*

#### TC-BE-014: Dispatch PK Lookups vs UK Lookups
```json
{
  "testId": "TC-BE-014",
  "name": "should route PK lookups to findByIdWithDetails and UK lookups to findByCodeWithDetails",
  "suite": "EmployeeDetailModel & EmployeeService Separation (PK vs UK)",
  "targetEdgeCase": "Routing integer id 42 to PK lookup and 'EMP-0042' to UK lookup",
  "input": {
    "pkLookupId": 42,
    "codeLookup": "EMP-0042"
  },
  "expectedOutput": {
    "findByIdWithDetailsCalled": 42,
    "findByCodeWithDetailsCalled": "EMP-0042"
  },
  "assertionsCount": 2,
  "status": "PASSED",
  "durationMs": 1.22,
  "realtimeOutput": "(pass) EmployeeDetailModel & EmployeeService Separation (PK vs UK) > should route PK lookups to findByIdWithDetails and UK lookups to findByCodeWithDetails [1.22ms]"
}
```

#### TC-BE-015: Validate Mandatory Fields on Employee Creation
```json
{
  "testId": "TC-BE-015",
  "name": "should validate mandatory fields when creating an employee",
  "suite": "EmployeeDetailModel & EmployeeService Separation (PK vs UK)",
  "targetEdgeCase": "Rejecting missing names, malformed email addresses, missing roles, and zero Annual CTC",
  "input": {
    "missingNames": { "email": "test@example.com" },
    "invalidEmail": { "first_name": "Jane", "last_name": "Doe", "email": "invalid-email" },
    "missingRole": { "first_name": "Jane", "last_name": "Doe", "email": "jane@example.com" },
    "zeroCtc": { "first_name": "Jane", "last_name": "Doe", "email": "jane@example.com", "role_id": 1, "annual_ctc": 0 }
  },
  "expectedOutput": {
    "nameError": "/First name and last name are required/",
    "emailError": "/A valid email address is required/",
    "roleError": "/Role ID is required/",
    "ctcError": "/Annual CTC must be greater than zero/"
  },
  "assertionsCount": 4,
  "status": "PASSED",
  "durationMs": 0.67,
  "realtimeOutput": "(pass) EmployeeDetailModel & EmployeeService Separation (PK vs UK) > should validate mandatory fields when creating an employee [0.67ms]"
}
```

---

### Suite 7: Standardized API Error Response Formatter
*Location: lines 345–373 in financials.test.ts*  
*Objective: Ensure consistent JSON envelope and HTTP status code format across all endpoints.*

#### TC-BE-016: Format `AppError`
```json
{
  "testId": "TC-BE-016",
  "name": "should format AppError into standardized status code and body",
  "suite": "Standardized API Error Response Formatter",
  "targetEdgeCase": "Domain exceptions mapped to designated HTTP status code and error payload",
  "input": {
    "error": "new AppError('Financial Immutability Violation', 403, 'FinancialLockError')"
  },
  "expectedOutput": {
    "status": 403,
    "body": {
      "success": false,
      "statusCode": 403,
      "code": "FinancialLockError",
      "error": "Financial Immutability Violation",
      "timestamp": "ISO_TIMESTAMP"
    }
  },
  "assertionsCount": 6,
  "status": "PASSED",
  "durationMs": 0.35,
  "realtimeOutput": "(pass) Standardized API Error Response Formatter > should format AppError into standardized status code and body [0.35ms]"
}
```

#### TC-BE-017: Format Generic Native Error
```json
{
  "testId": "TC-BE-017",
  "name": "should format standard Error into default status code and code name",
  "suite": "Standardized API Error Response Formatter",
  "targetEdgeCase": "Unhandled native JavaScript errors mapped safely to HTTP 500 without crashing",
  "input": {
    "error": "new Error('Database connection failed')",
    "defaultStatus": 500,
    "defaultCode": "DatabaseError"
  },
  "expectedOutput": {
    "status": 500,
    "body": {
      "success": false,
      "statusCode": 500,
      "code": "DatabaseError",
      "error": "Database connection failed",
      "timestamp": "ISO_TIMESTAMP"
    }
  },
  "assertionsCount": 6,
  "status": "PASSED",
  "durationMs": 0.08,
  "realtimeOutput": "(pass) Standardized API Error Response Formatter > should format standard Error into default status code and code name [0.08ms]"
}
```

---

### Suite 8: Full Name Multi-Field Search Support
*Location: lines 375–389 in financials.test.ts*  
*Objective: Enable directory search across concatenated `first_name` and `last_name`.*

#### TC-BE-018: Multi-Field Search by Concatenated Name
```json
{
  "testId": "TC-BE-018",
  "name": "should find employee by full name (first + last name concatenation)",
  "suite": "Full Name Multi-field Search Support",
  "targetEdgeCase": "Space-separated query matching concatenated first and last names across database rows",
  "input": {
    "search": "Bryon Ryan"
  },
  "expectedOutput": {
    "totalFound": ">= 1",
    "employee_id": "EMP-01027",
    "first_name": "Bryon",
    "last_name": "Ryan"
  },
  "assertionsCount": 3,
  "status": "PASSED",
  "durationMs": 152.00,
  "realtimeOutput": "(pass) Full Name Multi-field Search Support > should find employee by full name (first + last name concatenation) [152.00ms]"
}
```

---

### Suite 9: Bearer Token Authentication & User Verification
*Location: lines 391–468 in financials.test.ts*  
*Objective: Complete cryptographic validation, PBKDF2 password hashing, and token expiration handling.*

#### TC-BE-019: Authenticate Admin & Issue Bearer Token
```json
{
  "testId": "TC-BE-019",
  "name": "should authenticate admin user and issue valid Bearer token",
  "suite": "Bearer Token Authentication & User Verification",
  "targetEdgeCase": "Valid credentials returning 3-part Bearer token with ADMIN role payload",
  "input": {
    "username": "admin",
    "password": "adminpassword"
  },
  "expectedOutput": {
    "tokenValid": true,
    "tokenParts": 3,
    "username": "admin",
    "role": "ADMIN",
    "verifiedUsername": "admin",
    "verifiedRole": "ADMIN"
  },
  "assertionsCount": 6,
  "status": "PASSED",
  "durationMs": 20.36,
  "realtimeOutput": "(pass) Bearer Token Authentication & User Verification > should authenticate admin user and issue valid Bearer token [20.36ms]"
}
```

#### TC-BE-020: Reject Invalid Password (401)
```json
{
  "testId": "TC-BE-020",
  "name": "should reject invalid password with 401 InvalidCredentialsError",
  "suite": "Bearer Token Authentication & User Verification",
  "targetEdgeCase": "Rejecting incorrect password attempts",
  "input": {
    "username": "admin",
    "password": "wrongpassword"
  },
  "expectedOutput": {
    "rejected": true,
    "errorMessage": "/Invalid username or password/"
  },
  "assertionsCount": 1,
  "status": "PASSED",
  "durationMs": 5.48,
  "realtimeOutput": "(pass) Bearer Token Authentication & User Verification > should reject invalid password with 401 InvalidCredentialsError [5.48ms]"
}
```

#### TC-BE-021: Register New Administrator & Immediate Login
```json
{
  "testId": "TC-BE-021",
  "name": "should register a new administrator user and issue Bearer token",
  "suite": "Bearer Token Authentication & User Verification",
  "targetEdgeCase": "End-to-end admin account onboarding, PBKDF2 salt generation, and instant authentication",
  "input": {
    "username": "admin_test_<TIMESTAMP>",
    "password": "prodpassword123",
    "full_name": "Production Administrator"
  },
  "expectedOutput": {
    "tokenIssued": true,
    "userCreated": true,
    "role": "ADMIN",
    "immediateLoginSuccessful": true
  },
  "assertionsCount": 4,
  "status": "PASSED",
  "durationMs": 29.49,
  "realtimeOutput": "(pass) Bearer Token Authentication & User Verification > should register a new administrator user and issue Bearer token [29.49ms]"
}
```

#### TC-BE-022: Prevent Duplicate Username Conflicts
```json
{
  "testId": "TC-BE-022",
  "name": "should reject registration when username already exists",
  "suite": "Bearer Token Authentication & User Verification",
  "targetEdgeCase": "Conflict rejection for pre-existing usernames (e.g. 'admin')",
  "input": {
    "username": "admin",
    "password": "anotherpassword"
  },
  "expectedOutput": {
    "rejected": true,
    "errorMessage": "/Username is already taken/"
  },
  "assertionsCount": 1,
  "status": "PASSED",
  "durationMs": 2.35,
  "realtimeOutput": "(pass) Bearer Token Authentication & User Verification > should reject registration when username already exists [2.35ms]"
}
```

#### TC-BE-023: Reject Malformed Token Signatures Gracefully
```json
{
  "testId": "TC-BE-023",
  "name": "should safely reject tokens with malformed signatures without throwing unhandled TypeErrors",
  "suite": "Bearer Token Authentication & User Verification",
  "targetEdgeCase": "Preventing unhandled Node crypto.timingSafeEqual buffer length mismatch crashes when signature bytes differ",
  "input": {
    "truncatedToken": "header.payload.short",
    "malformedToken": "bad-token"
  },
  "expectedOutput": {
    "truncatedTokenError": "/Invalid token signature/",
    "malformedTokenError": "/Invalid authentication token format/"
  },
  "assertionsCount": 2,
  "status": "PASSED",
  "durationMs": 0.32,
  "realtimeOutput": "(pass) Bearer Token Authentication & User Verification > should safely reject tokens with malformed signatures without throwing unhandled TypeErrors [0.32ms]"
}
```

#### TC-BE-024: Reject Expired Bearer Tokens (401)
```json
{
  "testId": "TC-BE-024",
  "name": "should reject expired Bearer tokens with 401 TokenExpiredError",
  "suite": "Bearer Token Authentication & User Verification",
  "targetEdgeCase": "Token expired in the past (exp: Date.now() - 3600 seconds)",
  "input": {
    "tokenExpiredHoursAgo": 1
  },
  "expectedOutput": {
    "rejected": true,
    "errorMessage": "/Session token has expired/"
  },
  "assertionsCount": 1,
  "status": "PASSED",
  "durationMs": 0.47,
  "realtimeOutput": "(pass) Bearer Token Authentication & User Verification > should reject expired Bearer tokens with 401 TokenExpiredError [0.47ms]"
}
```

---

### Suite 10: Employee Management Service (CRUD & Validations)
*Location: lines 470–576 in financials.test.ts*  
*Objective: Ensure employee onboarding, automatic sequential IDs, updates, validations, and exit cycle queries operate with full integrity.*

#### TC-BE-025: Auto-Generate Sequential `EMP-XXXXX`
```json
{
  "testId": "TC-BE-025",
  "name": "should auto-generate sequential EMP-XXXXX ID when creating employee without employee_id",
  "suite": "Employee Management Service (CRUD & Validations)",
  "targetEdgeCase": "Automated sequential employee ID formatting matching ^EMP-\\d{5}$",
  "input": {
    "first_name": "TestAutomated",
    "last_name": "Employee",
    "email": "test.automated.<TIMESTAMP>@acme.com",
    "role_id": 1,
    "country_code": "US",
    "annual_ctc": 150000,
    "status": "ACTIVE",
    "date_of_joining": "2026-11-01"
  },
  "expectedOutput": {
    "idDefined": true,
    "employeeIdPattern": "^EMP-\\d{5}$",
    "first_name": "TestAutomated",
    "status": "ACTIVE"
  },
  "assertionsCount": 4,
  "status": "PASSED",
  "durationMs": 13.70,
  "realtimeOutput": "(pass) Employee Management Service (CRUD & Validations) > should auto-generate sequential EMP-XXXXX ID when creating employee without employee_id [13.70ms]"
}
```

#### TC-BE-026: Validate & Update Existing Employee Profile
```json
{
  "testId": "TC-BE-026",
  "name": "should validate and update existing employee profile",
  "suite": "Employee Management Service (CRUD & Validations)",
  "targetEdgeCase": "Updating employee first name, annual CTC, and status to EXITING with last_working_day",
  "input": {
    "targetEmployeeId": "<CREATED_EMPLOYEE_ID>",
    "updatePayload": {
      "first_name": "UpdateTestModified",
      "annual_ctc": 1200000,
      "status": "EXITING",
      "last_working_day": "2026-11-30"
    }
  },
  "expectedOutput": {
    "first_name": "UpdateTestModified",
    "annual_ctc": 1200000,
    "status": "EXITING",
    "last_working_day": "2026-11-30"
  },
  "assertionsCount": 5,
  "status": "PASSED",
  "durationMs": 14.63,
  "realtimeOutput": "(pass) Employee Management Service (CRUD & Validations) > should validate and update existing employee profile [14.63ms]"
}
```

#### TC-BE-027: Reject Zero/Negative CTC & Invalid Email
```json
{
  "testId": "TC-BE-027",
  "name": "should reject employee creation with zero or negative annual CTC or invalid email",
  "suite": "Employee Management Service (CRUD & Validations)",
  "targetEdgeCase": "Rejecting annual_ctc: 0 and email missing '@' sign",
  "input": {
    "zeroCtcPayload": {
      "first_name": "Invalid",
      "last_name": "CTC",
      "email": "invalid.ctc@acme.com",
      "annual_ctc": 0
    },
    "invalidEmailPayload": {
      "first_name": "Invalid",
      "last_name": "Email",
      "email": "invalidemailformat",
      "annual_ctc": 100000
    }
  },
  "expectedOutput": {
    "zeroCtcRejection": "/Annual CTC must be greater than zero/",
    "invalidEmailRejection": "/A valid email address is required/"
  },
  "assertionsCount": 2,
  "status": "PASSED",
  "durationMs": 0.25,
  "realtimeOutput": "(pass) Employee Management Service (CRUD & Validations) > should reject employee creation with zero or negative annual CTC or invalid email [0.25ms]"
}
```

#### TC-BE-028: Return 404 AppError on Non-Existent Employee
```json
{
  "testId": "TC-BE-028",
  "name": "should return 404 AppError when updating a non-existent employee",
  "suite": "Employee Management Service (CRUD & Validations)",
  "targetEdgeCase": "Handling non-existent database ID (99999999) with 404 error instead of silent crash",
  "input": {
    "employeeId": 99999999,
    "updatePayload": { "first_name": "Ghost" }
  },
  "expectedOutput": {
    "rejected": true,
    "errorMessage": "/Employee with ID 99999999 not found/"
  },
  "assertionsCount": 1,
  "status": "PASSED",
  "durationMs": 2.46,
  "realtimeOutput": "(pass) Employee Management Service (CRUD & Validations) > should return 404 AppError when updating a non-existent employee [2.46ms]"
}
```

#### TC-BE-029: Link Exiting Employee to Cycle Exit Query
```json
{
  "testId": "TC-BE-029",
  "name": "should accurately link an updated EXITING employee to getExitingEmployees for the cycle",
  "suite": "Employee Management Service (CRUD & Validations)",
  "targetEdgeCase": "Verifying that updating employee to EXITING with last_working_day '2026-11-25' links them to November 2026 exit query",
  "input": {
    "status": "EXITING",
    "last_working_day": "2026-11-25",
    "queryMonth": 11,
    "queryYear": 2026
  },
  "expectedOutput": {
    "foundInExitQuery": true,
    "employeeStatus": "EXITING"
  },
  "assertionsCount": 2,
  "status": "PASSED",
  "durationMs": 28.61,
  "realtimeOutput": "(pass) Employee Management Service (CRUD & Validations) > should accurately link an updated EXITING employee to getExitingEmployees for the cycle [28.61ms]"
}
```

---

## 3. Real-Time Terminal Execution Output

```text
bun test v1.4.4 (38afee6c8)

tests\financials.test.ts:
(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately convert dollars to cents and back without float drift [0.85ms]
(pass) Financial Math & Currency Utilities (Integer Cents) > should calculate standard full-month salary and guarantee exact reconciliation [0.13ms]
(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately calculate mid-month exit proration using dynamic calendar days [0.58ms]
(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately prorate February (28 days in non-leap year) [0.04ms]
(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately prorate mid-month joining for an employee joining on Oct 15 (31-day month) [9.97ms]
(pass) Financial Math & Currency Utilities (Integer Cents) > should accurately calculate manual overrides with added bonus while keeping contractual bonus distinct [0.14ms]
(pass) SalaryCalculatorService Rule Validation > should succeed when rule percentages sum to exactly 100% [0.98ms]
(pass) SalaryCalculatorService Rule Validation > should throw an error when rule percentages do not sum to 100% [1.51ms]
(pass) Financial Immutability Guard > should allow operations on DRAFT records [0.06ms]
(pass) Financial Immutability Guard > should reject operations on PAID records with 403 Forbidden [0.67ms]
(pass) BaseModel Security: Column Allowlist Guard > should allow valid registered columns [0.06ms]
(pass) BaseModel Security: Column Allowlist Guard > should reject unauthorized or arbitrary SQL injection columns [0.05ms]
(pass) DepartmentModel & Service Validation > should correctly distinguish between numeric IDs and department codes in findByIdOrCode [1.47ms]
(pass) EmployeeDetailModel & EmployeeService Separation (PK vs UK) > should route PK lookups to findByIdWithDetails and UK lookups to findByCodeWithDetails [1.22ms]
(pass) EmployeeDetailModel & EmployeeService Separation (PK vs UK) > should validate mandatory fields when creating an employee [0.67ms]
(pass) Standardized API Error Response Formatter > should format AppError into standardized status code and body [0.35ms]
(pass) Standardized API Error Response Formatter > should format standard Error into default status code and code name [0.08ms]
(pass) Full Name Multi-field Search Support > should find employee by full name (first + last name concatenation) [152.00ms]
(pass) Bearer Token Authentication & User Verification > should authenticate admin user and issue valid Bearer token [20.36ms]
(pass) Bearer Token Authentication & User Verification > should reject invalid password with 401 InvalidCredentialsError [5.48ms]
(pass) Bearer Token Authentication & User Verification > should register a new administrator user and issue Bearer token [29.49ms]
(pass) Bearer Token Authentication & User Verification > should reject registration when username already exists [2.35ms]
(pass) Bearer Token Authentication & User Verification > should safely reject tokens with malformed signatures without throwing unhandled TypeErrors [0.32ms]
(pass) Bearer Token Authentication & User Verification > should reject expired Bearer tokens with 401 TokenExpiredError [0.47ms]
(pass) Employee Management Service (CRUD & Validations) > should auto-generate sequential EMP-XXXXX ID when creating employee without employee_id [13.70ms]
(pass) Employee Management Service (CRUD & Validations) > should validate and update existing employee profile [14.63ms]
(pass) Employee Management Service (CRUD & Validations) > should reject employee creation with zero or negative annual CTC or invalid email [0.25ms]
(pass) Employee Management Service (CRUD & Validations) > should return 404 AppError when updating a non-existent employee [2.46ms]
(pass) Employee Management Service (CRUD & Validations) > should accurately link an updated EXITING employee to getExitingEmployees for the cycle [28.61ms]

 29 pass
 0 fail
 102 expect() calls
Ran 29 tests across 1 file. [417.00ms]
```
