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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-3">Role & Seniority</th>
              <th className="py-3.5 px-3 text-center">Country</th>
              <th className="py-3.5 px-3 text-right">Annual CTC</th>
              <th className="py-3.5 px-3 text-right">Base</th>
              <th className="py-3.5 px-3 text-right">Allowance</th>
              <th className="py-3.5 px-3 text-right">Bonus</th>
              <th className="py-3.5 px-3 text-right">Gross</th>
              <th className="py-3.5 px-3 text-right">Retirals</th>
              <th className="py-3.5 px-3 text-right">Total Deduction</th>
              <th className="py-3.5 px-3 text-right">Net Take-Home</th>
              <th className="py-3.5 px-3 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-xs">
            {employees.map((emp) => {
              const hasSalary = emp.gross_salary !== null && emp.gross_salary !== undefined;
              const isPaid = emp.salary_status === 'PAID';

              return (
                <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name & ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-sm text-slate-900">{emp.first_name} {emp.last_name}</div>
                    <div className="flex items-center space-x-1.5 text-[11px] mt-0.5">
                      <span className="font-mono font-bold text-blue-600">{emp.employee_id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 truncate max-w-[140px]">{emp.email}</span>
                    </div>
                  </td>

                  {/* Role & Level */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-xs">{emp.role_title}</div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[11px] text-slate-500 font-medium">{emp.department_name}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] border ${getLevelBadgeClass(emp.role_level)}`}>
                        {emp.role_level}
                      </span>
                    </div>
                  </td>

                  {/* Country */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
                      {getCountryBadge(emp.country_code)}
                    </span>
                  </td>

                  {/* Annual CTC */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {formatUsd(emp.annual_ctc)}
                  </td>

                  {/* Base Salary */}
                  <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatUsd(emp.base_salary)}
                  </td>

                  {/* Allowance */}
                  <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatUsd(emp.allowance)}
                  </td>

                  {/* Bonus */}
                  <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatUsd(emp.bonus)}
                  </td>

                  {/* Monthly Gross */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatUsd(emp.gross_salary)}
                  </td>

                  {/* Employer Retirals */}
                  <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                    {formatUsd(emp.employer_retirals)}
                  </td>

                  {/* Total Deduction (Taxes) */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
                    {emp.tax_deduction ? `-${formatUsd(emp.tax_deduction)}` : '—'}
                  </td>

                  {/* Net Take-Home */}
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-600 text-sm whitespace-nowrap">
                    {formatUsd(emp.net_salary)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-5">
                    {isPaid ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Lock className="w-3 h-3 mr-1" /> Paid
                      </span>
                    ) : hasSalary ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Draft
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Uncalculated
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* View Payslip Button */}
                      <button
                        type="button"
                        disabled={!hasSalary}
                        onClick={() => onViewPayslip(emp)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                          hasSalary
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 cursor-pointer active:scale-95'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200'
                        }`}
                        title="View Official Payslip"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Payslip</span>
                      </button>

                      {/* Edit Salary Button (Disabled if Paid) */}
                      {isPaid ? (
                        <span
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 cursor-default"
                          title="Record is finalized and locked"
                        >
                          <Lock className="w-4 h-4" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!hasSalary}
                          onClick={() => onEditSalary(emp)}
                          className={`p-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all ${
                            hasSalary ? 'cursor-pointer active:scale-95' : 'opacity-40 cursor-not-allowed'
                          }`}
                          title="Adjust Salary Components"
                        >
                          <Edit3 className="w-4 h-4" />
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
