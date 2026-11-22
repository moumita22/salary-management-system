import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.js';
import DepartmentPills from './components/DepartmentPills.js';
import FilterToolbar from './components/FilterToolbar.js';
import EmployeeTable from './components/EmployeeTable.js';
import SettlementView from './components/SettlementView.js';
import Pagination from './components/Pagination.js';
import PayslipModal from './components/PayslipModal.js';
import SalaryEditModal from './components/SalaryEditModal.js';
import {
  getDepartments,
  getEmployees,
  getExitingEmployees,
  generateMonthlyPayroll,
  disbursePayroll,
  updateEmployeeSalary,
  generateSettlement,
} from './services/api.js';
import type {
  Department,
  Employee,
  SalaryStatus,
} from './types/index.js';

export default function App(): React.JSX.Element {
  // Navigation & View State
  const [activeView, setActiveView] = useState<'directory' | 'exits'>('directory');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Data & Table State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Exits State
  const [exits, setExits] = useState<Employee[]>([]);
  const [loadingExits, setLoadingExits] = useState<boolean>(false);
  const [generatingSettlementId, setGeneratingSettlementId] = useState<number | null>(null);

  // Payroll Lifecycle State
  const [payoutPeriod] = useState({ month: 11, year: 2026 });
  const [payrollStatus, setPayrollStatus] = useState<SalaryStatus | string>('DRAFT');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDisbursing, setIsDisbursing] = useState<boolean>(false);

  // Modals State
  const [payslipEmployee, setPayslipEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [isSavingSalary, setIsSavingSalary] = useState<boolean>(false);

  // Toast / Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Debounce Search Input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Load Departments on Mount
  useEffect(() => {
    getDepartments()
      .then((data: any) => {
        const depts = Array.isArray(data) ? data : data.departments || data.data || [];
        setDepartments(depts);
      })
      .catch((err) => console.error('Failed to load departments:', err));
  }, []);

  // 3. Load Employees whenever filters or pagination change
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await getEmployees({
        departmentId: selectedDeptId,
        countryCode,
        level,
        search: debouncedSearch,
        page: currentPage,
        limit: pageSize,
        month: payoutPeriod.month,
        year: payoutPeriod.year,
      });

      const empList = Array.isArray(data) ? data : data.employees || data.data || [];
      const total = data.total ?? data.pagination?.total ?? empList.length;
      const pages = data.totalPages ?? data.pagination?.totalPages ?? (Math.ceil(total / pageSize) || 1);

      setEmployees(empList);
      setTotalItems(total);
      setTotalPages(pages);
      if (data.payrollStatus) setPayrollStatus(data.payrollStatus);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId, countryCode, level, debouncedSearch, currentPage, pageSize, payoutPeriod]);

  useEffect(() => {
    if (activeView === 'directory') {
      loadEmployees();
    }
  }, [loadEmployees, activeView]);

  // 4. Load Exiting Employees when Exits tab is active
  const loadExits = useCallback(async () => {
    setLoadingExits(true);
    try {
      const data: any = await getExitingEmployees({
        month: payoutPeriod.month,
        year: payoutPeriod.year,
      });
      const exitList = Array.isArray(data) ? data : data.exits || data.data || [];
      setExits(exitList);
    } catch (err) {
      console.error('Failed to load exits:', err);
    } finally {
      setLoadingExits(false);
    }
  }, [payoutPeriod]);

  useEffect(() => {
    if (activeView === 'exits') {
      loadExits();
    }
  }, [loadExits, activeView]);

  // 5. Actions: Generate Monthly Payroll for All 10k Employees
  const handleGeneratePayroll = async () => {
    if (
      !window.confirm(
        'Generate November 2026 payroll for all 10,000 employees using database policy rules?'
      )
    ) {
      return;
    }

    setIsGenerating(true);
    try {
      const res: any = await generateMonthlyPayroll({
        month: payoutPeriod.month,
        year: payoutPeriod.year,
      });
      showToast(`🎉 Generated payroll for ${res.generatedCount?.toLocaleString() || res.count?.toLocaleString() || '10,000'} employees!`);
      loadEmployees();
      if (activeView === 'exits') loadExits();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 6. Actions: Disburse and Lock Payday
  const handleDisbursePayroll = async () => {
    if (
      !window.confirm(
        'Simulate month-end payday? All November 2026 salaries will be marked PAID and locked against further edits.'
      )
    ) {
      return;
    }

    setIsDisbursing(true);
    try {
      const res: any = await disbursePayroll({
        month: payoutPeriod.month,
        year: payoutPeriod.year,
      });
      setPayrollStatus('PAID');
      showToast(`🔒 Disbursed & locked ${res.lockedCount?.toLocaleString() || res.disbursedCount?.toLocaleString() || '10,000'} employee records!`);
      loadEmployees();
      if (activeView === 'exits') loadExits();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDisbursing(false);
    }
  };

  // 7. Actions: Save Salary Override
  const handleSaveSalaryAdjustment = async (employeeId: number, payload: any) => {
    setIsSavingSalary(true);
    try {
      await updateEmployeeSalary(employeeId, {
        month: payoutPeriod.month,
        year: payoutPeriod.year,
        ...payload,
      });
      showToast('Salary adjustments saved successfully!');
      setEditEmployee(null);
      loadEmployees();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingSalary(false);
    }
  };

  // 8. Actions: Generate Settlement Proration for Exiting Employee
  const handleGenerateSettlement = async (empId: number) => {
    setGeneratingSettlementId(empId);
    try {
      const res: any = await generateSettlement(empId, {
        month: payoutPeriod.month,
        year: payoutPeriod.year,
      });
      showToast(`Settlement generated: ${res.netSalary ? `$${res.netSalary.toLocaleString()}` : 'Completed'}`);
      loadExits();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setGeneratingSettlementId(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCountryCode('');
    setLevel('');
    setSelectedDeptId('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg font-semibold text-xs flex items-center space-x-2 ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        payoutPeriod={payoutPeriod}
        onGeneratePayroll={handleGeneratePayroll}
        onDisbursePayroll={handleDisbursePayroll}
        isGenerating={isGenerating}
        isDisbursing={isDisbursing}
        payrollStatus={payrollStatus}
        exitsCount={exits.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {activeView === 'directory' ? (
          <>
            {/* Horizontal Department Pill Bar */}
            <DepartmentPills
              departments={departments}
              selectedDeptId={selectedDeptId}
              onSelectDepartment={(id) => {
                setSelectedDeptId(id);
                setCurrentPage(1);
              }}
              totalEmployees={10000}
            />

            {/* Filter Toolbar */}
            <FilterToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              countryCode={countryCode}
              onCountryChange={(cc) => {
                setCountryCode(cc);
                setCurrentPage(1);
              }}
              level={level}
              onLevelChange={(lvl) => {
                setLevel(lvl);
                setCurrentPage(1);
              }}
              onResetFilters={handleResetFilters}
              totalResults={totalItems}
            />

            {/* Employee Table & Pagination */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
              <EmployeeTable
                employees={employees}
                loading={loading}
                onViewPayslip={setPayslipEmployee}
                onEditSalary={setEditEmployee}
              />

              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <SettlementView
              exits={exits}
              loading={loadingExits}
              onGenerateSettlement={handleGenerateSettlement}
              generatingId={generatingSettlementId}
            />
          </div>
        )}
      </main>

      {/* Payslip Preview Modal */}
      {payslipEmployee && (
        <PayslipModal
          employee={payslipEmployee}
          onClose={() => setPayslipEmployee(null)}
        />
      )}

      {/* Salary Adjustment Editor Modal */}
      {editEmployee && (
        <SalaryEditModal
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSave={handleSaveSalaryAdjustment}
          isSaving={isSavingSalary}
        />
      )}
    </div>
  );
}
