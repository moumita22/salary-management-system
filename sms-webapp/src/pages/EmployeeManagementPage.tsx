import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Building2,
  Globe,
  Filter,
  RotateCcw,
  UserCheck,
  UserX,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Header, Pagination, EmployeeModal } from '../components/index.js';
import { getDepartments, getEmployees } from '../services/api.js';
import type { Department, Employee } from '../types/index.js';
import { getCountryBadge } from '../utils/index.js';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXITING', label: 'Exiting' },
  { value: 'TERMINATED', label: 'Terminated' },
];

const COUNTRY_OPTIONS = [
  { value: '', label: 'All Countries' },
  { value: 'IN', label: 'India (IN)' },
  { value: 'US', label: 'United States (US)' },
  { value: 'DE', label: 'Germany (DE)' },
  { value: 'GB', label: 'United Kingdom (GB)' },
  { value: 'SG', label: 'Singapore (SG)' },
];

export default function EmployeeManagementPage(): React.JSX.Element {
  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [countryCode, setCountryCode] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Debounce Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Departments on mount
  useEffect(() => {
    getDepartments()
      .then((data) => {
        setDepartments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load departments:', err);
      });
  }, []);

  // Load Employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees({
        page: currentPage,
        limit: pageSize,
        departmentId: selectedDeptId || undefined,
        countryCode: countryCode || undefined,
        search: debouncedSearch || undefined,
        status: statusFilter,
        allEmployees: true, // Fetch across all employees regardless of cycle date
      });

      const list = res.data || [];
      const total = res.pagination?.total ?? list.length;
      const pages = res.pagination?.totalPages ?? (Math.ceil(total / pageSize) || 1);

      setEmployees(list);
      setTotalItems(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('Failed to load employees:', err);
      showToast('Failed to load employees. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedDeptId, countryCode, debouncedSearch, statusFilter]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchEmployees();
  }, [fetchEmployees]);

  const handleOpenAddModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    showToast(selectedEmployee ? 'Employee updated successfully!' : 'New employee created successfully!');
    fetchEmployees();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDeptId('');
    setStatusFilter('ALL');
    setCountryCode('');
    setCurrentPage(1);
  };

  const isFiltered = Boolean(debouncedSearch || selectedDeptId || statusFilter !== 'ALL' || countryCode);

  const formatCurrency = (amount: number | string) => {
    const num = Number(amount) || 0;
    return `$${Math.round(num).toLocaleString('en-US')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg font-semibold text-xs flex items-center space-x-2 ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
          {/* Page Title & Add Button Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Management</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalItems.toLocaleString()} Total Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Directory of all organization staff. Add new hires, edit profile attributes, and manage lifecycle status.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Employee</span>
            </button>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, EMP ID, or email..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Department Dropdown */}
              <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent focus:outline-none font-medium cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.department_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent focus:outline-none font-medium cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Dropdown */}
              <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent focus:outline-none font-medium cursor-pointer"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Employee Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Annual CTC</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joining / LWD</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <span>Loading employee directory...</span>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <UserX className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="font-semibold text-slate-700">No employees found</p>
                          <p className="text-slate-400 text-xs">
                            {isFiltered
                              ? 'Try adjusting your search query or filters to find what you are looking for.'
                              : 'No employee records are available in the system.'}
                          </p>
                          {isFiltered && (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                              <span>Reset Filters</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => {
                      const status = emp.status?.toUpperCase() || 'ACTIVE';
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* EMP ID */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                              {emp.employee_id}
                            </span>
                          </td>

                          {/* Name & Email */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {emp.first_name?.[0]}
                                {emp.last_name?.[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-[11px] text-slate-500 font-normal">{emp.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Department & Role */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-slate-900">{emp.role_title || 'N/A'}</p>
                              <p className="text-[11px] text-slate-500">
                                {emp.department_name || emp.department_id || 'General'}
                                {emp.role_level && ` • ${emp.role_level}`}
                              </p>
                            </div>
                          </td>

                          {/* Country */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                              {getCountryBadge(emp.country_code)}
                            </span>
                          </td>

                          {/* Annual CTC */}
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                            {formatCurrency(emp.annual_ctc)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {status === 'ACTIVE' ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck className="w-3 h-3" />
                                <span>ACTIVE</span>
                              </span>
                            ) : status === 'EXITING' ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                <span>EXITING</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <UserX className="w-3 h-3" />
                                <span>TERMINATED</span>
                              </span>
                            )}
                          </td>

                          {/* Joining & LWD */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                            <div>
                              <span>Joined: {emp.date_of_joining ? emp.date_of_joining.split('T')[0] : 'N/A'}</span>
                              {emp.last_working_day && (
                                <p className="text-rose-600 font-medium">
                                  LWD: {emp.last_working_day.split('T')[0]}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(emp)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 bg-white">
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
        </div>
      </main>

      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        employee={selectedEmployee}
        departments={departments}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
