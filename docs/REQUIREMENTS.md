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
* **Employee Profile:** ID, Full Name, Email, Department, Designation, Country, Employment Type (`FULL_TIME`, `PART_TIME`, `INTERN`), Status (`ACTIVE`, `INACTIVE`), Date of Joining.
* **7 Strongly-Typed Financial Columns :**
  * `Base Salary`, `Allowance`, `Bonus`, `Gross Salary`, `Deductions`, `Net Salary`, `CTC`.
* **Audit Snapshot (`calculation_snapshot JSONB`):**
  * Preserves the exact percentage rules and custom additions used at the time of salary generation for historical auditability.
* **Currency Normalization:**
  * Stores local currency amounts + normalized `CTC_USD` for global reporting.

#### D. Dynamic Compensation Breakdown by Employment Type
* **`FULL_TIME`:** Auto-calculates standard percentage breakdown from CTC:
  * Base: 50%
  * Allowances: 30%
  * Bonus: 10%
  * Employer Retirals/Benefits: 10%
  * Estimated Tax/Deduction: Bracket-based (10%)
  * UI allows HR to override any component or add one-off bonuses.
* **`INTERN` / `PART_TIME`:** Simplified model:
  * Interns receive a flat monthly/annual stipend (Base/Gross = Stipend, zero bonus/retirals).
  * Part-time staff receive a fixed base without complex benefit deductions.

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
   * *Reasoning:* Real-time exchange rate APIs introduce external rate limits, network failures, and test flakiness. Deterministic conversion rates are managed via a relational currency table.
6. **Complex Multi-Tier Approval Workflows:**
   * *Reasoning:* Multi-level approval trees (Manager $\rightarrow$ VP $\rightarrow$ Finance) add state-machine complexity without addressing the core 10,000 employee salary management and analytics requirement.
7. **Direct PDF File Download Button:**
   * *Reasoning:* In-app visual preview satisfies the verification requirement without bloating frontend dependencies.


