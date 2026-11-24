# ACME Salary Management System (SMS) - Web Application

A high-performance enterprise web application built for ACME Organization's HR team to manage compensation, view salary breakdowns, handle exits, and disburse monthly payroll across **10,000 employees** and **12 global departments**.

---

## 🚀 Key Features

- **10,000 Employee High-Performance Grid:** Fast, lag-free data grid with server-side pagination (10, 25, 50, 100 rows per page) and 300ms debounced search by name or employee ID.
- **Department-First Navigation:** Interactive pill bar allowing instant navigation across all 12 organizational departments (Engineering, Sales, Operations, Finance, etc.).
- **Multi-Country & Tier Filtering:** Filter directory by country (`IN`, `US`, `DE`, `GB`, `SG`) and seniority level (`JUNIOR`, `MID_LEVEL`, `SENIOR`).
- **Payroll Lifecycle Management:**
  - View cycle metrics (Eligible, Calculated, Disbursed, Total Gross, Total Net).
  - One-click batch payroll generation for the active period.
  - Simulation payday disbursement trigger that locks records into an immutable `PAID` state.
- **Mid-Month Exit & LWD Settlement Proration:**
  - Dedicated "Exits & Settlements" view tracking resigning and exiting staff.
  - Automated proration based on exact calendar days worked up to Last Working Day (LWD).
  - Single-click settlement generation and individual disbursement.
- **In-App Payslip Preview Modal:** Transparent breakdown of monthly CTC into Base, Allowances, Performance Bonus, Retirals, and Statutory Deductions with exact percentages.
- **Employee Master Directory:**
  - Create and edit employee profiles with real-time validation.
  - Immutability safeguard: `TERMINATED` employees display a locked badge and reject edits.
  - Joining and LWD date pickers bounded to a maximum of next month.
- **Authentication & Security:**
  - JWT Bearer token authentication with auto-refresh and protected route guards.
  - Error modal with technical diagnosis codes and automated retry mechanisms.

---

## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict typing, Zero `any`)
- **Bundler & Dev Server:** [Vite 8](https://vitejs.dev/) with Hot Module Replacement (HMR)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Router:** [React Router v7](https://reactrouter.com/)
- **Test Runner:** [Vitest](https://vitest.dev/) + [@testing-library/react](https://testing-library.com/)
- **Linter:** [Oxlint](https://oxc.rs/)

---

## 📁 Source Code Structure

```
sms-webapp/src/
├── components/                 # Modular reusable UI components
│   ├── DepartmentPills.tsx     # Department tab navigation bar
│   ├── DisburseConfirmModal.tsx# Confirmation modal for payday locking
│   ├── EmployeeModal.tsx       # Create/Edit employee modal with date constraints
│   ├── EmployeeTable.tsx       # Primary 10k data grid with actions
│   ├── ErrorBoundary.tsx       # React error boundary catching render crashes
│   ├── ErrorModal.tsx          # Technical error diagnosis modal with retry
│   ├── FilterToolbar.tsx       # Search, Country, Level, and Action controls
│   ├── GenerateConfirmModal.tsx# Confirmation modal for 10k batch payroll
│   ├── Header.tsx              # Global navigation, month-year picker, auth status
│   ├── MonthYearPicker.tsx     # Calendar popover bounded to next month
│   ├── Pagination.tsx          # Dynamic page controls and item counts
│   ├── PayslipModal.tsx        # Itemized compensation breakdown modal
│   ├── ProtectedRoute.tsx      # Auth routing guard redirecting to /login
│   ├── SalaryEditModal.tsx     # Manual salary adjustment & spot bonus modal
│   └── SettlementView.tsx      # Exits and final settlement management table
│
├── context/
│   └── AuthContext.tsx         # User authentication state & token persistence
│
├── pages/
│   ├── EmployeeManagementPage.tsx # Master employee directory and CRUD
│   ├── LoginPage.tsx              # Sign-in and admin registration
│   └── SalaryManagementPage.tsx   # Payroll cycle, 10k grid, and exits view
│
├── services/
│   └── api.ts                  # Typed Axios/Fetch API client with error handling
│
├── test/
│   ├── EmployeeModal.test.tsx  # Component & edge-case unit tests
│   ├── LoginPage.test.tsx      # Auth form validation & state tests
│   ├── ProtectedRoute.test.tsx # Route security & redirection tests
│   └── setup.ts                # Vitest DOM environment configuration
│
├── types/
│   └── index.ts                # Shared TypeScript contracts and interfaces
│
└── utils/
    └── formatters.ts           # USD currency formatting and country badges
```

---

## 💻 Available Scripts

Run the following commands from the `sms-webapp` directory:

| Command | Description |
| :--- | :--- |
| `bun run dev` (or `npm run dev`) | Starts local development server on `http://localhost:5173` |
| `bun run build` (or `npm run build`) | Compiles optimized production bundle in `dist/` |
| `bun run preview` (or `npm run preview`) | Previews local production build |
| `bun run test` (or `npm test`) | Executes Vitest unit tests in fast CI mode |
| `bun run lint` (or `npm run lint`) | Runs Oxlint linter across all source files |

---

## 🔒 Default Test Credentials

For quick evaluation, use the pre-configured admin account:
- **Username:** `admin`
- **Password:** `adminpassword`
