# Product Requirements Document (PRD)
## ACME Salary Management System (SMS)

---

### 1. Goal & Problem Statement

* **Context:** ACME organization currently manages compensation for **10,000 employees** across multiple countries using spreadsheets (Excel).
* **Goal:** Deliver a secure, high-performance web application (React frontend + Node.js/Express API + PostgreSQL) that enables the HR Manager to manage salary data seamlessly, inspect compensation department-by-department without UI freezing, and answer strategic questions about organizational pay practices.

---

### 2. User Persona

* **Primary Persona:** **HR Manager** at ACME.
* **Core Jobs To Be Done :**
  * Browse and review compensation across 10,000 global staff segmented by department.
  * Search by employee name, employee ID, and filter by country and role/designation within each department.
  * Define and adjust salary structures based on country/role policies.
  * Disburse monthly payroll and ensure records are locked against accidental modifications.
  * Inspect individual employee payslip previews with transparent component percentages.

---

### 3. Scope & Key Features

#### A. 10,000 Employee Dataset & Department Distribution
The 10,000 employees are distributed across 12 realistic organizational departments:

| Department | Headcount Target |
| :--- | :--- |
| **Engineering** | 3,000 |
| **Sales** | 1,200 |
| **Operations** | 1,000 |
| **Customer Support** | 900 |
| **Marketing** | 700 |
| **Finance** | 600 |
| **Product Management** | 600 |
| **Data & Analytics** | 500 |
| **Research & Development** | 500 |
| **Human Resources** | 400 |
| **Legal & Compliance** | 300 |
| **Administration** | 300 |
| **Total Headcount** | **10,000** |

#### B. Department-First UI & High-Performance Data Grid
* **Pill-Bar Navigation:** Horizontal, pill-tab bar at the top displaying all departments (e.g. `[Engineering]`, `[Sales]`, etc.).
* **Scoped Search & Filtering:** Within the selected department, HR can:
  * Instantly search by Employee Name or ID.
  * Filter by Country (e.g., India, Usa, UK) and Role/Designation.
* **Server-Side Pagination:** Chunked queries, preventing browser memory lag across 10,000 rows.

#### C. Relational Data Model & Financial Integrity (PostgreSQL)
* **Normalized 5-Table Schema:**
  * `departments`: Unique `id`, `department_id` (e.g. `DEP-01`), and `name`.
  * `roles`: Job titles and seniority levels (`JUNIOR`, `MID_LEVEL`, `SENIOR`) belonging to departments.
  * `salary_component_rules`: Percentage policy rules per role and country, strictly enforced to sum to 100%.
  * `employee_details`: Master record storing `employee_id`, demographic details, `role_id`, `country_code`, `annual_ctc` (USD), and `last_working_day`.
  * `employee_salary_details`: Monthly financial payouts in USD (`base_salary`, `allowance`, `bonus`, `employer_retirals`, `gross_salary`, `tax_deduction`, `net_salary`, and `calculation_snapshot JSONB`).
* **Financial Integrity:**
  * Strict `NUMERIC(14, 2)` precision for all currency figures.
  * Composite Unique Constraints preventing duplicate roles, duplicate rules, and duplicate monthly employee disbursements.
  * All monetary figures unified in **USD ($)** for seamless aggregation across global departments.

#### D. Dynamic Compensation Breakdown by Role & Seniority Tier
* **Tiered Policy Rules (`salary_component_rules`):**
  * Compensation structures vary by role and seniority level (e.g., Junior engineers receive higher Base % with lower bonus, Senior roles receive higher Bonus % margins).
  * Auto-calculates monthly breakdown from employee's `annual_ctc`:
    * Monthly Base Salary
    * Monthly Allowances
    * Performance Bonus
    * Employer Retirals/Benefits
    * Estimated Tax Deductions
  * Live UI allows HR to override any component or add one-off spot bonuses before locking.

#### E. Mid-Month Exit & Last Working Day (LWD) Settlement Proration
* **Mid-Month Resignation/Exit Proration:**
  * If an employee exits ACME before the month ends, their compensation is prorated based on their `last_working_day` (`lwd`):
    $$\text{Payable Gross Salary} = \frac{\text{Monthly Gross Salary}}{\text{Total Days in Month}} \times \text{Days Worked up to LWD}$$
  * Statutory deductions/taxes apply on the prorated payable gross to calculate final net settlement.
* **Exits & Settlements View:**
  * Employees table includes an optional `last_working_day` (`lwd`) field.
  * To keep the main 10k directory clean, exiting employees in the current month appear in a dedicated **"Exits & Settlements"** view with a **"Generate Settlement"** action button.

#### F. Payment Lifecycle & Financial Immutability
* **Status Lifecycle:** `DRAFT` $\rightarrow$ `PAID (LOCKED)`.
* **Month-End Payday Event:** Automated last-day-of-the-month check locks the current cycle.
* **Simulate Payday Trigger:** Admin toolbar button allowing evaluators to simulate month-end disbursement and immediately verify record locking.
* **Immutability Rule:** Paid records reject modifications (`403 Forbidden`). Raises are recorded as new revisions for the subsequent cycle.

#### G. In-App Payslip Preview Modal
* Modal displaying the official ACME payslip with itemized percentages and amounts (Base, Allowances, Gross, Deductions, Net Take-Home).

#### H. API Documentation & Unit Testing
* **Bruno API Collection (`api-docs/`):** Version-controlled plain-text `.bru` request files for testing endpoints.
* **Automated Unit Tests (Jest / Bun Test):** Deterministic tests for salary math, component breakdowns, payment locking state machine, LWD settlement proration, and currency conversions.

---

### 4. What We Are Deliberately Leaving Out (and Reasoning)

*(Demonstrating engineering judgment and scope discipline)*

1. **Daily Attendance & Biometric Loss of Pay (LOP) Tracking:**
   * *Reasoning:* To properly track Loss of Pay for 10,000 active employees, you would need:
     * An entire Attendance & Leave Management System (tracking paid, casual, sick, and unpaid leaves).
     * Multi-country public holiday calendars (since holidays differ across countries).
     * Building attendance tracking into this system is unnecessary scope creep.
2. **Full-Blown Banking / ACH Payout Rails:**
   * *Reasoning:* Scope is *Compensation Management & Analysis*, not bank operations. Real bank routing, wire transfers, and tax authority filing are left to downstream banking gateways.
3. **Automated SMTP Email Delivery:**
   * *Reasoning:* Replaced with an **In-App Payslip Preview Modal**. Since dummy/seeded employees do not have active email inboxes, the in-app preview allows the HR manager and evaluators to inspect the generated payslip immediately without requiring external email configuration.
4. **Dynamic User-Defined Table Schema Modifications (`ALTER TABLE` on the fly):**
   * *Reasoning:* Dynamically altering relational database tables on the fly is highly time-consuming to implement and maintain. Instead, storing custom component details directly in `calculation_snapshot JSONB` provides the required flexibility simply and efficiently.
5. **Live External Forex API Integration:**
   * *Reasoning:* Real-time third-party exchange rate APIs introduce external rate limits, network latency, and test flakiness. To ensure seamless compensation benchmarking and equitable global comparisons across all 12 departments, all employee contracts, component rules, and payroll records are standardized directly in **USD ($)**.
6. **Complex Multi-Tier Approval Workflows:**
   * *Reasoning:* Multi-level approval trees (Manager $\rightarrow$ VP $\rightarrow$ Finance) add state-machine complexity without addressing the core 10,000 employee salary management and analytics requirement.
7. **Direct PDF File Download Button:**
   * *Reasoning:* In-app visual preview satisfies the verification requirement without bloating frontend dependencies.

---

### 5. Architectural Evolutions & Added Enhancements (Post-V1 Refinements)

During iterative engineering and code audits, the system evolved from the initial specification to solve critical real-world edge cases. Below is the documentation of what was added, what was modified, and the rationale behind each decision:

#### A. Enterprise Authentication & Role-Based Session Security
* **What was added:** Dedicated `admin_users` relational table, PBKDF2 password hashing (10,000 iterations with 16-byte random salt), signed Bearer tokens with expiration, and React `<ProtectedRoute />` route guards.
* **Why it was added:** The initial PRD assumed an open session. However, an enterprise system managing $100M+ in annual compensation across 10,000 employees cannot operate without authentication. Adding lightweight, cryptographically secure authentication ensures that all data modification endpoints (`/salaries/generate`, `/salaries/disburse`, `/employees`) require authenticated administrator identity without relying on heavy third-party identity providers.

#### B. Terminated Employee Immutability Guard
* **What was added:** Backend immutability check in `employee.service.ts` throwing `403 Forbidden` (`EmployeeTerminatedLockError`) if modifying an employee whose status is `TERMINATED`. On the frontend, the Edit button is dynamically replaced with a `<Lock /> Locked` indicator badge.
* **Why it was added:** Once an employee has completed their exit cycle, their historical employment contract, tax deductions, and final payout must be permanently frozen for labor law and audit compliance. Permitting retroactive edits to a terminated employee's CTC or role creates accounting discrepancies and violates financial record-keeping standards.

#### C. Strict Upper Calendar Boundaries (Next-Month Constraint)
* **What was added:** `MonthYearPicker` and date inputs (`date_of_joining`, `last_working_day`) enforce an upper boundary preventing selection of any date beyond next month (`currentMonth + 1`).
* **Why it was added:** HR managers cannot disburse or run payroll years in the future, nor can an employee be hired multiple years in advance. Restricting calendar selection prevents accidental creation of phantom payroll cycles while providing sufficient flexibility for upcoming month planning.

#### D. Scoped Dynamic Headcount Reporting in Modals
* **What was changed:** The "Generate Payroll" and "Disburse Payday" confirmation modals previously displayed a static `"10,000 employees"` string. They now dynamically bind to `(cycleMetrics?.total_eligible ?? totalItems)`.
* **Why it was changed:** When the HR manager filters by department (e.g. "Engineering" with 3,000 headcount) or when employees join or exit mid-cycle, the eligible payroll count changes. Displaying the exact dynamic count guarantees total visibility before initiating irreversible financial batch operations.

#### E. Discretionary Spot Bonus vs Contractual Performance Bonus Separation
* **What was added:** Introduced a dedicated `added_bonus NUMERIC(14, 2)` column in `employee_salary_details` separate from the policy-governed `bonus` column, paired with a dedicated `SalaryEditModal`.
* **Why it was added:** Contractual performance bonuses are governed by role/seniority percentages in `salary_component_rules`. Discretionary spot awards, retention grants, or manual adjustments must remain distinct in payslips and audit logs to avoid distorting base policy percentages.

#### F. High-Visibility Extended Toast Notifications
* **What was changed:** Toast notification typography enlarged to `text-sm font-bold`, with display duration increased from 4 seconds to 6 seconds.
* **Why it was changed:** On high-resolution enterprise displays (1440p / 4K), standard 4-second toast alerts often disappeared before the HR manager could read the asynchronous server status. The 6-second window provides optimal readability.

#### G. Complete 24-Endpoint Bruno API Test Suite
* **What was added:** 24 plain-text `.bru` request files covering 100% of the backend REST endpoints, equipped with `script:post-response` hooks that automatically capture the JWT token upon login and propagate it across all protected requests.
* **Why it was added:** To verify every backend route without needing to copy-paste tokens or import bloated Postman JSON exports.



