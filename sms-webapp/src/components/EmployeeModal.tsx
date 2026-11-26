import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Mail, DollarSign, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { getRoles, createEmployee, updateEmployee } from '../services/api.js';
import type { Department, Employee } from '../types/index.js';
import { getTodayIsoDate } from '../utils/formatters.js';

export interface EmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

interface RoleOption {
  id: number;
  department_id: number;
  title: string;
  level: string;
  department_name?: string;
}

const COUNTRY_OPTIONS = [
  { code: 'IN', label: 'India (IN)', currency: 'INR (₹)' },
  { code: 'US', label: 'United States (US)', currency: 'USD ($)' },
  { code: 'DE', label: 'Germany (DE)', currency: 'EUR (€)' },
  { code: 'GB', label: 'United Kingdom (GB)', currency: 'GBP (£)' },
  { code: 'SG', label: 'Singapore (SG)', currency: 'SGD (S$)' },
];

function getMaxAllowedDate(): string {
  const now = new Date();
  // month + 2 with day 0 gives the last calendar day of next month
  const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const yyyy = endOfNextMonth.getFullYear();
  const mm = String(endOfNextMonth.getMonth() + 1).padStart(2, '0');
  const dd = String(endOfNextMonth.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function EmployeeModal({
  isOpen,
  employee,
  departments,
  onClose,
  onSuccess,
}: EmployeeModalProps): React.JSX.Element | null {
  const isEdit = Boolean(employee);

  // Form State
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [countryCode, setCountryCode] = useState<string>('IN');
  const [annualCtc, setAnnualCtc] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [dateOfJoining, setDateOfJoining] = useState<string>('');
  const [lastWorkingDay, setLastWorkingDay] = useState<string>('');

  // Dropdown data & submit state
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Date constraints: LWD must be from today up to end of next month
  // If an existing employee already has a past LWD, permit that date so viewing/editing profile succeeds
  const [todayDate] = useState<string>(() => getTodayIsoDate());
  const [maxDate] = useState<string>(() => getMaxAllowedDate());
  const minLwdDate = useMemo(() => {
    if (isEdit && employee?.last_working_day) {
      const existingLwd = employee.last_working_day.split('T')[0];
      if (existingLwd < todayDate) return existingLwd;
    }
    return todayDate;
  }, [isEdit, employee, todayDate]);

  // Initialize form when opened or employee prop changes
  useEffect(() => {
    if (isOpen) {
      // oxlint-disable-next-line react/set-state-in-effect
      setErrorMessage(null);
      if (employee) {
        setFirstName(employee.first_name || '');
        setLastName(employee.last_name || '');
        setEmail(employee.email || '');
        setSelectedDeptId(employee.department_id ? String(employee.department_id) : '');
        setRoleId(employee.role_id || '');
        setCountryCode(employee.country_code || 'IN');
        setAnnualCtc(employee.annual_ctc ? String(employee.annual_ctc) : '');
        setStatus(employee.status || 'ACTIVE');
        setDateOfJoining(employee.date_of_joining ? employee.date_of_joining.split('T')[0] : '');
        setLastWorkingDay(employee.last_working_day ? employee.last_working_day.split('T')[0] : '');
      } else {
        // Defaults for Add Employee
        setFirstName('');
        setLastName('');
        setEmail('');
        setSelectedDeptId(departments[0]?.department_id || '');
        setRoleId('');
        setCountryCode('IN');
        setAnnualCtc('');
        setStatus('ACTIVE');
        setDateOfJoining(new Date().toISOString().split('T')[0]);
        setLastWorkingDay('');
      }
    }
  }, [isOpen, employee, departments]);

  // Fetch roles whenever selected department changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    // oxlint-disable-next-line react/set-state-in-effect
    setLoadingRoles(true);

    getRoles(selectedDeptId || undefined)
      .then((data) => {
        if (!isMounted) return;
        setRoles(data);
        // If current roleId doesn't belong to new list, reset or pick first
        if (data.length > 0) {
          const match = data.find((r) => r.id === roleId);
          if (!match && !isEdit) {
            setRoleId(data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch roles:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingRoles(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDeptId, isOpen, roleId, isEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First Name and Last Name are required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid corporate email address.');
      return;
    }
    if (!roleId) {
      setErrorMessage('Please select a role.');
      return;
    }
    const ctcNum = parseFloat(annualCtc);
    if (isNaN(ctcNum) || ctcNum <= 0) {
      setErrorMessage('Annual CTC must be a positive number.');
      return;
    }
    if (!dateOfJoining) {
      setErrorMessage('Date of Joining is required.');
      return;
    }
    if (dateOfJoining > maxDate) {
      setErrorMessage(`Date of Joining cannot be after next month (${maxDate}).`);
      return;
    }
    if ((status === 'EXITING' || status === 'TERMINATED') && !lastWorkingDay) {
      setErrorMessage('Last Working Day is required for Exiting or Terminated status.');
      return;
    }
    if (lastWorkingDay) {
      if (lastWorkingDay < minLwdDate) {
        setErrorMessage(`Last Working Day cannot be before minimum allowed date (${minLwdDate}).`);
        return;
      }
      if (lastWorkingDay > maxDate) {
        setErrorMessage(`Last Working Day cannot be after next month (${maxDate}).`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const resolvedStatus =
        lastWorkingDay && status === 'ACTIVE'
          ? 'EXITING'
          : !lastWorkingDay && status === 'EXITING'
          ? 'ACTIVE'
          : status;

      if (isEdit && employee) {
        await updateEmployee(employee.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          role_id: Number(roleId),
          country_code: countryCode,
          annual_ctc: ctcNum,
          status: resolvedStatus,
          date_of_joining: dateOfJoining,
          last_working_day: lastWorkingDay || null,
        });
      } else {
        await createEmployee({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          role_id: Number(roleId),
          country_code: countryCode,
          annual_ctc: ctcNum,
          status: resolvedStatus,
          date_of_joining: dateOfJoining,
          last_working_day: lastWorkingDay || null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string } | null;
      setErrorMessage(errObj?.message || 'Failed to save employee profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? `Edit Employee (${employee?.employee_id})` : 'Add New Employee'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Update employee profile, compensation, and status' : 'Create an employee record with auto-assigned EMP-XXXXX ID'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Jane"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corporate Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Department & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">-- All / Default --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.department_id}>
                    {d.name} ({d.department_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Role <span className="text-rose-500">*</span></span>
                {loadingRoles && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </label>
              <select
                value={roleId}
                required
                onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select Role --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Country & Annual CTC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country <span className="text-rose-500">*</span>
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Annual CTC ($) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={annualCtc}
                  onChange={(e) => setAnnualCtc(e.target.value)}
                  placeholder="Enter amount in dollar"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Status & Employment Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXITING">EXITING</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Joining <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  disabled={isEdit}
                  max={maxDate}
                  value={dateOfJoining}
                  onChange={(e) => setDateOfJoining(e.target.value)}
                  onClick={(e) => {
                    if (isEdit) return;
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // fallback
                    }
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    isEdit
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80'
                      : 'cursor-pointer'
                  }`}
                  title={isEdit ? 'Date of joining cannot be modified after employee creation.' : undefined}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Working Day {(status === 'EXITING' || status === 'TERMINATED') && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  min={minLwdDate}
                  max={maxDate}
                  value={lastWorkingDay}
                  onChange={(e) => setLastWorkingDay(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // fallback
                    }
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    status === 'EXITING' || status === 'TERMINATED'
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-slate-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Create Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
