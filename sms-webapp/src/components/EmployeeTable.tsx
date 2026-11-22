import React from 'react';
import { FileText, Edit3, Lock, AlertCircle } from 'lucide-react';
import type { Employee, SeniorityLevel } from '../types/index.js';

export interface EmployeeTableProps {
  employees: Employee[];
  loading?: boolean;
  onViewPayslip: (employee: Employee) => void;
  onEditSalary: (employee: Employee) => void;
}

export default function EmployeeTable({
  employees = [],
  loading = false,
  onViewPayslip,
  onEditSalary,
}: EmployeeTableProps): React.JSX.Element {
  const formatUsd = (val?: number | string | null): string => {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getLevelBadgeClass = (level?: SeniorityLevel): string => {
    switch (level) {
      case 'SENIOR':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MID_LEVEL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCountryBadge = (code: string): string => {
    switch (code) {
      case 'IN':
        return '🇮🇳 IN';
      case 'US':
        return '🇺🇸 US';
      case 'DE':
        return '🇩🇪 DE';
      case 'GB':
        return '🇬🇧 GB';
      case 'SG':
        return '🇸🇬 SG';
      default:
        return code;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm shadow-xs animate-pulse">
        <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-semibold text-slate-700">Loading employees from PostgreSQL...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching paginated department records</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="font-bold text-slate-800 text-sm">No employees match your search or filter</h4>
        <p className="text-xs text-slate-500 mt-1">Try clearing your filters or changing department</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Role & Seniority</th>
              <th className="py-3.5 px-4">Country</th>
              <th className="py-3.5 px-4">Annual CTC</th>
              <th className="py-3.5 px-4">Monthly Gross</th>
              <th className="py-3.5 px-4">Taxes</th>
              <th className="py-3.5 px-4">Net Take-Home</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {employees.map((emp) => {
              const hasSalary = emp.gross_salary !== null && emp.gross_salary !== undefined;
              const isPaid = emp.salary_status === 'PAID';

              return (
                <tr key={emp.employee_id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Name & ID */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</div>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="font-mono font-bold text-amber-600">{emp.employee_id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 truncate max-w-[140px]">{emp.email}</span>
                    </div>
                  </td>

                  {/* Role & Level */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{emp.role_title}</div>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-500">{emp.department_name}</span>
                      <span className={`px-1.5 py-0.2 rounded-md font-bold text-[9px] border ${getLevelBadgeClass(emp.role_level)}`}>
                        {emp.role_level}
                      </span>
                    </div>
                  </td>

                  {/* Country */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                      {getCountryBadge(emp.country_code)}
                    </span>
                  </td>

                  {/* Annual CTC */}
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">
                    {formatUsd(emp.annual_ctc)}
                  </td>

                  {/* Monthly Gross */}
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {formatUsd(emp.gross_salary)}
                  </td>

                  {/* Taxes */}
                  <td className="py-3 px-4 font-mono text-rose-600">
                    {emp.tax_deduction ? `-${formatUsd(emp.tax_deduction)}` : '—'}
                  </td>

                  {/* Net Take-Home */}
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-sm">
                    {formatUsd(emp.net_salary)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {isPaid ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Lock className="w-2.5 h-2.5 mr-1" /> Paid
                      </span>
                    ) : hasSalary ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Draft
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Uncalculated
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* View Payslip Button */}
                      <button
                        type="button"
                        disabled={!hasSalary}
                        onClick={() => onViewPayslip(emp)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          hasSalary
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer shadow-xs active:scale-95'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200'
                        }`}
                        title="View Official Payslip"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Payslip</span>
                      </button>

                      {/* Edit Salary Button (Disabled if Paid) */}
                      {isPaid ? (
                        <span
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 cursor-default"
                          title="Record is finalized and locked"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!hasSalary}
                          onClick={() => onEditSalary(emp)}
                          className={`p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all ${
                            hasSalary ? 'cursor-pointer active:scale-95' : 'opacity-40 cursor-not-allowed'
                          }`}
                          title="Adjust Salary Components"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
