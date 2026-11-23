import React, { useState, useEffect, useCallback } from 'react';
import {
  Header,
  DepartmentPills,
  FilterToolbar,
  EmployeeTable,
  SettlementView,
  Pagination,
  PayslipModal,
  SalaryEditModal,
  GenerateConfirmModal,
  DisburseConfirmModal,
  ErrorModal,
} from './components/index.js';
import {
  getDepartments,
  getEmployees,
  getExitingEmployees,
  generateMonthlyPayroll,
  disbursePayroll,
  updateEmployeeSalary,
  generateSettlement,
  disburseSettlement,
  getSalaryMetrics,
  ApiError,
} from './services/api.js';
import type {
  Department,
  Employee,
  SalaryStatus,
  CycleMetrics,
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
  const [disbursingSettlementId, setDisbursingSettlementId] = useState<number | null>(null);

  // Payroll Lifecycle State
  const [payoutPeriod, setPayoutPeriod] = useState<{ month: number; year: number }>({ month: 11, year: 2026 });
  const [payrollStatus, setPayrollStatus] = useState<SalaryStatus | string>('DRAFT');
  const [cycleMetrics, setCycleMetrics] = useState<CycleMetrics | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDisbursing, setIsDisbursing] = useState<boolean>(false);

  // Dedicated Error Modal State
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    statusCode: number;
    code?: string;
    isCodeIssue?: boolean;
    timestamp?: string;
    onRetry?: () => void;
  } | null>(null);

  const [retryEmployeeCount, setRetryEmployeeCount] = useState<number>(0);
  const [retryExitCount, setRetryExitCount] = useState<number>(0);

  const showError = (err: unknown, fallbackMessage?: string, onRetry?: () => void) => {
    console.error('[Application Error]:', err);
    if (err instanceof ApiError) {
      setErrorModal({
        isOpen: true,
        title: err.isCodeIssue ? 'System / Code Error' : 'Action Failed',
        message: err.message,
        statusCode: err.statusCode,
        code: err.code,
        isCodeIssue: err.isCodeIssue,
        timestamp: err.timestamp,
        onRetry,
      });
    } else {
      const message = (err as any)?.message || fallbackMessage || 'An unexpected error occurred';
      setErrorModal({
        isOpen: true,
        title: 'Unexpected Error',
        message,
        statusCode: 500,
        code: 'UnexpectedException',
        isCodeIssue: true,
        timestamp: new Date().toLocaleTimeString(),
        onRetry,
      });
    }
  };

  // Sync Cycle Status whenever payoutPeriod or selected department changes
  const refreshMetrics = useCallback(async () => {
    try {
      const res = await getSalaryMetrics({
        month: payoutPeriod.month,
        year: payoutPeriod.year,
        departmentId: selectedDeptId || undefined,
      });
      if (res) {
        setCycleMetrics(res);
        if (res.status) {
          setPayrollStatus(res.status);
        }
      }
    } catch (err) {
      console.error('Failed to fetch salary metrics for period:', err);
    }
  }, [payoutPeriod, selectedDeptId]);

  useEffect(() => {
    let active = true;
    getSalaryMetrics({
      month: payoutPeriod.month,
      year: payoutPeriod.year,
      departmentId: selectedDeptId || undefined,
    })
      .then((res) => {
        if (active && res) {
          setCycleMetrics(res);
          if (res.status) {
            setPayrollStatus(res.status);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch salary metrics for period:', err);
      });

    return () => {
      active = false;
    };
  }, [payoutPeriod, selectedDeptId]);

  // Modals State
  const [payslipEmployee, setPayslipEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState<boolean>(false);
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
      .catch((err) => {
        showError(err, 'Failed to load departments');
      });
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
      showError(err, 'Failed to load employees', () => setRetryEmployeeCount((c) => c + 1));
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId, countryCode, level, debouncedSearch, currentPage, pageSize, payoutPeriod]);

  useEffect(() => {
    if (activeView === 'directory') {
      // oxlint-disable-next-line react/set-state-in-effect
      loadEmployees();
    }
  }, [loadEmployees, activeView, retryEmployeeCount]);

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
      showError(err, 'Failed to load exit settlements', () => setRetryExitCount((c) => c + 1));
    } finally {
      setLoadingExits(false);
    }
  }, [payoutPeriod]);

  useEffect(() => {
    if (activeView === 'exits') {
      // oxlint-disable-next-line react/set-state-in-effect
      loadExits();
    }
  }, [loadExits, activeView, retryExitCount]);

  const isFiltered = Boolean(selectedDeptId || countryCode || level || debouncedSearch);

  // 5. Actions: Open Payroll Generation Confirmation Dialog
  const handleOpenGenerateModal = () => {
    refreshMetrics();
    setIsGenerateModalOpen(true);
  };

  const handleConfirmGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      await generateMonthlyPayroll({
        month: payoutPeriod.month,
        year: payoutPeriod.year,
        departmentId: selectedDeptId || undefined,
        countryCode: countryCode || undefined,
        level: level || undefined,
        search: debouncedSearch || undefined,
      });
      setIsGenerateModalOpen(false);
      loadEmployees();
      refreshMetrics();
      if (activeView === 'exits') loadExits();
    } catch (err: any) {
      showError(err, 'Failed to generate monthly payroll');
    } finally {
      setIsGenerating(false);
    }
  };

  // 6. Actions: Disburse and Lock Payday (Confirmation Modal + Execution)
  const handleOpenDisburseModal = () => {
    if (selectedDeptId) {
      showToast('Payday disbursement must be executed from All Departments', 'error');
      return;
    }

    if (cycleMetrics && cycleMetrics.total_records < cycleMetrics.total_eligible) {
      showToast(
        `Cannot disburse payday: only ${cycleMetrics.total_records.toLocaleString()} of ${cycleMetrics.total_eligible.toLocaleString()} employees are generated. Please generate all departments first.`,
        'error'
      );
      return;
    }

    setIsDisburseModalOpen(true);
  };

  const handleConfirmDisburse = async () => {
    setIsDisbursing(true);
    try {
      const res: any = await disbursePayroll({
        month: payoutPeriod.month,
        year: payoutPeriod.year,
      });
      setPayrollStatus('PAID');
      setIsDisburseModalOpen(false);
      showToast(`🔒 Disbursed & locked ${res.lockedCount?.toLocaleString() || res.disbursedCount?.toLocaleString() || '10,000'} employee records!`);
      loadEmployees();
      refreshMetrics();
      if (activeView === 'exits') loadExits();
    } catch (err: any) {
      showError(err, 'Failed to disburse payroll');
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
      refreshMetrics();
    } catch (err: any) {
      showError(err, 'Failed to save salary adjustments');
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
      showError(err, 'Failed to generate exit settlement');
    } finally {
      setGeneratingSettlementId(null);
    }
  };

  // 9. Actions: Disburse and Lock Exit Settlement for an Exiting Employee
  const handleDisburseSettlement = async (empId: number) => {
    setDisbursingSettlementId(empId);
    try {
      await disburseSettlement(empId, {
        month: payoutPeriod.month,
        year: payoutPeriod.year,
      });
      showToast('Settlement disbursed and permanently locked.');
      loadExits();
      refreshMetrics();
    } catch (err: any) {
      showError(err, 'Failed to disburse exit settlement');
    } finally {
      setDisbursingSettlementId(null);
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
        onPeriodChange={setPayoutPeriod}
        payrollStatus={payrollStatus}
        cycleMetrics={cycleMetrics}
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
            />

            {/* Filter Toolbar (with Action Buttons between Search and Country Filter) */}
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
              onGeneratePayroll={handleOpenGenerateModal}
              onDisbursePayroll={handleOpenDisburseModal}
              isGenerating={isGenerating}
              isDisbursing={isDisbursing}
              payrollStatus={payrollStatus}
              selectedDeptId={selectedDeptId}
              cycleMetrics={cycleMetrics}
              filteredCount={totalItems}
              isFiltered={isFiltered}
            />

            {/* Employee Table & Pagination */}
            <div className="w-full px-4 sm:px-6 lg:px-8 mt-5">
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
          <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
            <SettlementView
              exits={exits}
              loading={loadingExits}
              onGenerateSettlement={handleGenerateSettlement}
              onDisburseSettlement={handleDisburseSettlement}
              onViewPayslip={setPayslipEmployee}
              generatingId={generatingSettlementId}
              disbursingId={disbursingSettlementId}
            />
          </div>
        )}
      </main>

      {/* Payslip Preview Modal */}
      {payslipEmployee && (
        <PayslipModal
          employee={payslipEmployee}
          payoutPeriod={payoutPeriod}
          onClose={() => setPayslipEmployee(null)}
        />
      )}

      {/* Salary Adjustment Editor Modal */}
      {editEmployee && (
        <SalaryEditModal
          key={editEmployee.id}
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSave={handleSaveSalaryAdjustment}
          isSaving={isSavingSalary}
        />
      )}

      {/* Payroll Generation Confirmation Modal */}
      <GenerateConfirmModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onConfirm={handleConfirmGeneratePayroll}
        isGenerating={isGenerating}
        payoutPeriod={payoutPeriod}
        targetLabel={
          isFiltered
            ? `${totalItems.toLocaleString()} filtered employees`
            : 'All Departments (10,000 employees)'
        }
        bonusRecipients={cycleMetrics?.bonus_recipients || []}
      />

      {/* Payday Disbursement Confirmation Modal */}
      <DisburseConfirmModal
        isOpen={isDisburseModalOpen}
        onClose={() => setIsDisburseModalOpen(false)}
        onConfirm={handleConfirmDisburse}
        isDisbursing={isDisbursing}
        payoutPeriod={payoutPeriod}
      />

      {/* Global Error Modal for API / System / Code Issues */}
      {errorModal && (
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal(null)}
          title={errorModal.title}
          message={errorModal.message}
          statusCode={errorModal.statusCode}
          code={errorModal.code}
          isCodeIssue={errorModal.isCodeIssue}
          timestamp={errorModal.timestamp}
          onRetry={errorModal.onRetry}
        />
      )}
    </div>
  );
}
