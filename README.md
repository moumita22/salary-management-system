# ACME Salary Management System (SMS)

A web-based enterprise application built for ACME Organization's HR team to manage compensation, view salary breakdowns, handle exits, and disburse monthly payroll across **10,000 employees** and **12 global departments**.

---

## ⚡ Quick Start Guide (For Evaluators)

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (for PostgreSQL 16)
- [Bun](https://bun.sh/) (v1.1+) or [Node.js](https://nodejs.org/) (v20+)

---

### Step 1: Start PostgreSQL Database
```bash
# From the project root
docker compose up -d
```
> Starts PostgreSQL 16 on port `5440` with database `sms_db`, username `postgres`, and password `postgrespassword`.

---

### Step 2: Seed 10,000 Employees & Default Admin
```bash
cd sms-backend
bun run seed    # or npm run seed
```
> Initializes normalized tables, creates indexes, seeds 12 departments, 36 roles, 180 rules, 10,000 employees, and the default system administrator in **~1.6 seconds**.

---

### Step 3: Start Backend API
```bash
# In sms-backend/
bun run dev     # or npm run dev
```
> The Express REST API starts on **`http://localhost:5000`** with live database telemetry.  
> Health check: `http://localhost:5000/health`

---

### Step 4: Start Frontend Application
```bash
# In sms-webapp/
cd ../sms-webapp
bun run dev     # or npm run dev
```
> The React 19 + Vite application starts on **`http://localhost:5173`**.

---

### Step 5: Log In
Open your browser to **`http://localhost:5173/login`**:
- **Username:** `admin`
- **Password:** `adminpassword`

---

## 🧪 Automated Testing & Code Quality

Both backend and frontend feature deterministic unit test suites with 100% pass rates:

```bash
# 1. Run Backend Unit Tests (30 tests: Integer math, ACID locks, proration, CRUD)
bun test --cwd sms-backend

# 2. Run Frontend Unit Tests (12 tests: Modals, auth validation, route guards)
bun run --cwd sms-webapp test

# 3. Run Frontend Linter (0 warnings, 0 errors across 33 files)
bun run --cwd sms-webapp lint

# 4. Compile Production Frontend Bundle
bun run --cwd sms-webapp build
```

---

## 📡 API Documentation (Bruno Collection)

The repository includes a complete, version-controlled **[Bruno](https://www.usebruno.com/)** API collection in [`api-docs/`](api-docs/) covering **100% of backend endpoints**:

1. Open Bruno and select **"Open Collection"** $\rightarrow$ choose the `api-docs` directory.
2. Select the **`Local`** environment (`baseUrl: http://localhost:5000/api`).
3. Run **`00-Auth/1-Login`** — a post-response script automatically saves the Bearer token into your environment for all subsequent calls.

### API Suites Overview (24 Requests):
- **`00-Auth`**: Login, Register Admin, Get Current User (`/me`).
- **`01-System`**: Health check & DB connection probe.
- **`02-Departments`**: Get all departments (with aggregated headcounts), Get department by ID.
- **`03-Roles`**: List roles, filter by department, Get role by ID.
- **`04-Salary-Rules`**: List 100% component rules, update policy percentages.
- **`05-Employees`**: Full paginated grid, search by name/code, filter by country/tier, Create employee, Update profile, Get by code/ID.
- **`06-Exits-And-Settlements`**: Get exiting employees, generate prorated settlement, disburse settlement.
- **`07-Payroll-Lifecycle`**: Batch generate payroll, get cycle metrics, update salary overrides/spot bonus, disburse and lock payday.

---

## 📂 Repository Structure

```
sms/
├── api-docs/                  # Bruno plain-text API collection (24 endpoints)
│   ├── 00-Auth/               # Authentication & token capture
│   ├── 01-System/             # Health check endpoints
│   ├── 02-Departments/        # Department endpoints
│   ├── 03-Roles/              # Role & seniority endpoints
│   ├── 04-Salary-Rules/       # 100% policy rule enforcement
│   ├── 05-Employees/          # Employee CRUD, search, and filters
│   ├── 06-Exits-And-Settlements/ # Proration & exit settlements
│   ├── 07-Payroll-Lifecycle/  # Batch payroll generation & payday locks
│   ├── collection.bru         # Collection-level Bearer authorization
│   └── environments/Local.bru # Local environment variables
│
├── docs/                      # Architectural & product design artifacts
│   ├── REQUIREMENTS.md        # Product Requirements Document (PRD) & trade-offs
│   ├── BACKEND_ARCHITECTURE.md# ACID transactions, integer math, and architecture
│   ├── ER_DIAGRAM.md          # 5-table relational schema & foreign key constraints
│   ├── DATA_GENERATION_PLAN.md# 10,000 employee distribution matrix
│   └── TEST_DOCUMENTATION.md  # Unit test execution logs & coverage reports
│
├── sms-backend/               # Node.js / Bun + Express + PostgreSQL REST API
│   ├── scripts/seed.js        # 10,000-employee batch database seed script
│   ├── src/
│   │   ├── config/            # PostgreSQL pool & DDL schema definition
│   │   ├── controllers/       # HTTP response controllers (Strict unknown error typing)
│   │   ├── middleware/        # JWT Bearer auth & global error formatters
│   │   ├── models/            # Data Access Layer with SQL column allowlists
│   │   ├── routes/            # Express endpoint routing
│   │   ├── services/          # Pure domain business logic & transaction orchestrators
│   │   └── types/             # Shared TypeScript interfaces (Zero 'any')
│   └── tests/financials.test.ts # 30 unit tests (Integer math, locks, proration)
│
├── sms-webapp/                # React 19 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/        # Data grid, modals, pill navigation, date bounds
│   │   ├── context/           # Auth context & session management
│   │   ├── pages/             # Salary Management, Employee Management, Login
│   │   ├── services/          # Typed API client with custom error diagnosis
│   │   └── test/              # Vitest + Testing Library test suites
│   └── README.md              # Dedicated frontend documentation
│
├── docker-compose.yml         # Containerized PostgreSQL 16 service
└── README.md                  # Root project documentation & evaluator guide
```

---

## 📑 Assessment Artifacts & Design Trade-offs

Detailed design rationales and documentation can be found in [`docs/`](docs/):

- **[Product Requirements Document](docs/REQUIREMENTS.md):** Defines target personas, feature scope, and what was intentionally omitted (e.g. biometric LOP tracking, live banking rails) to focus on compensation engineering.
- **[Backend Architecture Document](docs/BACKEND_ARCHITECTURE.md):** Covers business logic, core engineering principles, architectural & sequence diagrams, and backend file structure.
- **[ER Diagram & Schema Guide](docs/ER_DIAGRAM.md):** Visual Mermaid ER diagram of the 6 relational tables and B-Tree indexing strategy.
- **[10,000 Employee Data Generation Plan](docs/DATA_GENERATION_PLAN.md):** Department headcount quotas, seniority mix, compensation bands, and seed benchmark execution logs.
- **[Test Documentation](docs/TEST_DOCUMENTATION.md):** Complete code coverage metrics and real-time execution outputs.
- **[AI Development Log](docs/AI_DEVELOPMENT_LOG.md):** Transparent record of prompts, human-AI collaboration, architectural course corrections, and engineering decisions.
- **[Frontend Webapp Documentation](sms-webapp/README.md):** Dedicated UI architecture, component catalog, testing, and development setup.
