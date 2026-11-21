import { pool, initDatabase } from '../src/config/db.js';
import { faker } from '@faker-js/faker';

// Fix faker seed for deterministic results
faker.seed(42);

// 1. Exact 12 Departments with quotas (Total = 10,000)
const DEPARTMENTS = [
  { department_id: 'DEP-01', name: 'Engineering', quota: 3000 },
  { department_id: 'DEP-02', name: 'Sales', quota: 1200 },
  { department_id: 'DEP-03', name: 'Operations', quota: 1000 },
  { department_id: 'DEP-04', name: 'Customer Support', quota: 900 },
  { department_id: 'DEP-05', name: 'Marketing', quota: 700 },
  { department_id: 'DEP-06', name: 'Finance', quota: 600 },
  { department_id: 'DEP-07', name: 'Product Management', quota: 600 },
  { department_id: 'DEP-08', name: 'Data & Analytics', quota: 500 },
  { department_id: 'DEP-09', name: 'Research & Development', quota: 500 },
  { department_id: 'DEP-10', name: 'Human Resources', quota: 400 },
  { department_id: 'DEP-11', name: 'Legal & Compliance', quota: 300 },
  { department_id: 'DEP-12', name: 'Administration', quota: 300 },
];

// 2. Roles: 3 tiers per department
const ROLES_BY_DEPT = {
  'DEP-01': [
    { title: 'Junior Software Engineer', level: 'JUNIOR' },
    { title: 'Software Engineer', level: 'MID_LEVEL' },
    { title: 'Senior Staff Engineer', level: 'SENIOR' },
  ],
  'DEP-02': [
    { title: 'Junior Sales Associate', level: 'JUNIOR' },
    { title: 'Account Executive', level: 'MID_LEVEL' },
    { title: 'Sales Director', level: 'SENIOR' },
  ],
  'DEP-03': [
    { title: 'Operations Associate', level: 'JUNIOR' },
    { title: 'Operations Specialist', level: 'MID_LEVEL' },
    { title: 'Senior Operations Manager', level: 'SENIOR' },
  ],
  'DEP-04': [
    { title: 'Support Representative', level: 'JUNIOR' },
    { title: 'Customer Success Specialist', level: 'MID_LEVEL' },
    { title: 'Support Lead', level: 'SENIOR' },
  ],
  'DEP-05': [
    { title: 'Marketing Associate', level: 'JUNIOR' },
    { title: 'Marketing Specialist', level: 'MID_LEVEL' },
    { title: 'Growth Marketing Lead', level: 'SENIOR' },
  ],
  'DEP-06': [
    { title: 'Junior Financial Analyst', level: 'JUNIOR' },
    { title: 'Financial Analyst', level: 'MID_LEVEL' },
    { title: 'Senior Finance Manager', level: 'SENIOR' },
  ],
  'DEP-07': [
    { title: 'Associate Product Manager', level: 'JUNIOR' },
    { title: 'Product Manager', level: 'MID_LEVEL' },
    { title: 'Principal Product Manager', level: 'SENIOR' },
  ],
  'DEP-08': [
    { title: 'Junior Data Analyst', level: 'JUNIOR' },
    { title: 'Data Scientist', level: 'MID_LEVEL' },
    { title: 'Lead Data Architect', level: 'SENIOR' },
  ],
  'DEP-09': [
    { title: 'Research Associate', level: 'JUNIOR' },
    { title: 'R&D Engineer', level: 'MID_LEVEL' },
    { title: 'Principal Scientist', level: 'SENIOR' },
  ],
  'DEP-10': [
    { title: 'HR Coordinator', level: 'JUNIOR' },
    { title: 'HR Generalist', level: 'MID_LEVEL' },
    { title: 'Senior HR Business Partner', level: 'SENIOR' },
  ],
  'DEP-11': [
    { title: 'Legal Associate', level: 'JUNIOR' },
    { title: 'Compliance Specialist', level: 'MID_LEVEL' },
    { title: 'Legal Counsel', level: 'SENIOR' },
  ],
  'DEP-12': [
    { title: 'Administrative Assistant', level: 'JUNIOR' },
    { title: 'Office Coordinator', level: 'MID_LEVEL' },
    { title: 'Facilities Manager', level: 'SENIOR' },
  ],
};

// 3. Supported Countries (India first, 40% target)
const COUNTRIES = [
  { code: 'IN', weight: 40 },
  { code: 'US', weight: 25 },
  { code: 'DE', weight: 15 },
  { code: 'GB', weight: 10 },
  { code: 'SG', weight: 10 },
];

function getRandomCountry() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const c of COUNTRIES) {
    cumulative += c.weight;
    if (rand < cumulative) return c.code;
  }
  return 'IN';
}

// 4. Department-Specific Rule Matrix (All sum to exactly 100.00%)
function getPercentages(deptId, level) {
  if (deptId === 'DEP-01' || deptId === 'DEP-08' || deptId === 'DEP-09') {
    // Engineering, Data, R&D
    if (level === 'JUNIOR') return { base: 55, allowance: 25, bonus: 10, retirals: 10, deduction: 8 };
    if (level === 'MID_LEVEL') return { base: 50, allowance: 25, bonus: 15, retirals: 10, deduction: 12 };
    return { base: 40, allowance: 20, bonus: 30, retirals: 10, deduction: 18 };
  } else if (deptId === 'DEP-02') {
    // Sales: High commission
    if (level === 'JUNIOR') return { base: 45, allowance: 20, bonus: 25, retirals: 10, deduction: 10 };
    if (level === 'MID_LEVEL') return { base: 35, allowance: 20, bonus: 35, retirals: 10, deduction: 14 };
    return { base: 25, allowance: 15, bonus: 50, retirals: 10, deduction: 20 };
  } else if (deptId === 'DEP-05' || deptId === 'DEP-07') {
    // Product & Marketing
    if (level === 'JUNIOR') return { base: 55, allowance: 25, bonus: 10, retirals: 10, deduction: 8 };
    if (level === 'MID_LEVEL') return { base: 45, allowance: 25, bonus: 20, retirals: 10, deduction: 12 };
    return { base: 40, allowance: 20, bonus: 30, retirals: 10, deduction: 18 };
  } else if (deptId === 'DEP-03' || deptId === 'DEP-04' || deptId === 'DEP-12') {
    // Operations, Support & Admin: Steady base
    if (level === 'JUNIOR') return { base: 65, allowance: 25, bonus: 0, retirals: 10, deduction: 6 };
    if (level === 'MID_LEVEL') return { base: 60, allowance: 25, bonus: 5, retirals: 10, deduction: 10 };
    return { base: 50, allowance: 25, bonus: 15, retirals: 10, deduction: 15 };
  } else {
    // Finance, HR, Legal
    if (level === 'JUNIOR') return { base: 60, allowance: 25, bonus: 5, retirals: 10, deduction: 8 };
    if (level === 'MID_LEVEL') return { base: 50, allowance: 25, bonus: 15, retirals: 10, deduction: 12 };
    return { base: 45, allowance: 20, bonus: 25, retirals: 10, deduction: 16 };
  }
}

// Realistic Annual CTC Bands (USD)
function getAnnualCtc(level) {
  if (level === 'JUNIOR') {
    return Math.round(faker.number.float({ min: 45000, max: 75000, fractionDigits: 2 }));
  } else if (level === 'MID_LEVEL') {
    return Math.round(faker.number.float({ min: 75000, max: 130000, fractionDigits: 2 }));
  } else {
    return Math.round(faker.number.float({ min: 130000, max: 220000, fractionDigits: 2 }));
  }
}

// Exit dates for LWD testing
const EXIT_DATES = ['2026-11-13', '2026-11-20', '2026-11-25', '2026-11-08'];

async function seed() {
  const startTime = Date.now();
  console.log('--- Starting ACME Salary Management 10k Seed Script ---');

  // Step 1: Ensure fresh schema
  console.log('1. Initializing clean schema...');
  await initDatabase();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 2: Insert 12 Departments
    console.log('2. Seeding 12 departments...');
    const deptIdMap = new Map(); // department_id string -> database integer id
    for (const d of DEPARTMENTS) {
      const res = await client.query(
        'INSERT INTO departments (department_id, name) VALUES ($1, $2) RETURNING id;',
        [d.department_id, d.name]
      );
      deptIdMap.set(d.department_id, res.rows[0].id);
    }

    // Step 3: Insert 36 Roles
    console.log('3. Seeding 36 roles (Junior, Mid, Senior per department)...');
    const rolesList = [];
    for (const [deptCode, roles] of Object.entries(ROLES_BY_DEPT)) {
      const dbDeptId = deptIdMap.get(deptCode);
      for (const r of roles) {
        const res = await client.query(
          'INSERT INTO roles (department_id, title, level) VALUES ($1, $2, $3) RETURNING id;',
          [dbDeptId, r.title, r.level]
        );
        rolesList.push({
          id: res.rows[0].id,
          deptCode,
          title: r.title,
          level: r.level,
        });
      }
    }

    // Step 4: Insert Salary Component Rules for all (role, country_code)
    console.log('4. Seeding salary component rules across 5 countries (India first)...');
    const rulesMap = new Map(); // key: `${roleId}_${countryCode}` -> rule
    const countryCodes = ['IN', 'US', 'DE', 'GB', 'SG']; // India first
    for (const role of rolesList) {
      const pct = getPercentages(role.deptCode, role.level);
      for (const cc of countryCodes) {
        await client.query(
          `INSERT INTO salary_component_rules 
           (role_id, country_code, base_percentage, allowance_percentage, bonus_percentage, employer_retirals_percentage, deduction_percentage)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [role.id, cc, pct.base, pct.allowance, pct.bonus, pct.retirals, pct.deduction]
        );
        rulesMap.set(`${role.id}_${cc}`, pct);
      }
    }

    // Step 5: Generate 10,000 Employees department by department
    console.log('5. Generating 10,000 employees department by department...');
    const employeesToInsert = [];
    let empCounter = 1;

    for (const dept of DEPARTMENTS) {
      const deptRoles = rolesList.filter((r) => r.deptCode === dept.department_id);
      const juniorRole = deptRoles.find((r) => r.level === 'JUNIOR');
      const midRole = deptRoles.find((r) => r.level === 'MID_LEVEL');
      const seniorRole = deptRoles.find((r) => r.level === 'SENIOR');

      for (let i = 0; i < dept.quota; i++) {
        // Seniority distribution: 40% Junior, 40% Mid, 20% Senior
        let chosenRole;
        const roleRand = Math.random();
        if (roleRand < 0.40) chosenRole = juniorRole;
        else if (roleRand < 0.80) chosenRole = midRole;
        else chosenRole = seniorRole;

        const countryCode = getRandomCountry();
        const annualCtc = getAnnualCtc(chosenRole.level);

        const empId = `EMP-${String(empCounter).padStart(5, '0')}`;
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${empCounter}@acme.org`;

        // ~60 employees exiting across departments for LWD testing
        const isExiting = empCounter % 160 === 0;
        const status = isExiting ? 'EXITING' : 'ACTIVE';
        const lwd = isExiting ? EXIT_DATES[empCounter % EXIT_DATES.length] : null;

        employeesToInsert.push({
          empId,
          firstName,
          lastName,
          email,
          roleId: chosenRole.id,
          countryCode,
          annualCtc,
          status,
          lwd,
          dateOfJoining: faker.date.past({ years: 4 }).toISOString().split('T')[0],
          deptCode: dept.department_id,
          roleTitle: chosenRole.title,
          roleLevel: chosenRole.level,
        });

        empCounter++;
      }
    }

    console.log(`Generated ${employeesToInsert.length} employees in memory. Batch inserting in chunks of 1,000...`);

    // Step 6: Fast chunked batch insert into employee_details only
    const BATCH_SIZE = 1000;
    const totalBatches = Math.ceil(employeesToInsert.length / BATCH_SIZE);

    for (let b = 0; b < employeesToInsert.length; b += BATCH_SIZE) {
      const batchStartTime = Date.now();
      const batchNumber = Math.floor(b / BATCH_SIZE) + 1;
      const batch = employeesToInsert.slice(b, b + BATCH_SIZE);

      // Build bulk insert query for employee_details
      const empValues = [];
      const empParams = [];
      let pIdx = 1;

      for (const e of batch) {
        empValues.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        empParams.push(
          e.empId,
          e.firstName,
          e.lastName,
          e.email,
          e.roleId,
          e.countryCode,
          e.annualCtc,
          e.status,
          e.dateOfJoining,
          e.lwd
        );
      }

      const insertEmpQuery = `
        INSERT INTO employee_details 
        (employee_id, first_name, last_name, email, role_id, country_code, annual_ctc, status, date_of_joining, last_working_day)
        VALUES ${empValues.join(', ')};
      `;

      await client.query(insertEmpQuery, empParams);
      const batchDuration = ((Date.now() - batchStartTime) / 1000).toFixed(3);
      const runningElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  ⏱️  Batch ${batchNumber}/${totalBatches}: Inserted ${b + batch.length} / ${employeesToInsert.length} employees (took ${batchDuration}s | running time: ${runningElapsed}s)`);
    }

    await client.query('COMMIT');
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 SEED SUCCESSFUL! Seeded 12 departments, 36 roles, 180 rules, and exactly 10,000 employees in ${elapsed}s across ${totalBatches} batches.`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed transaction failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
