import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import type { Employee } from '../types/index.js';

export interface PayslipModalProps {
  employee: Employee | null;
  onClose: () => void;
}

export default function PayslipModal({ employee, onClose }: PayslipModalProps): React.JSX.Element | null {
  if (!employee) return null;

  const snapshot: any = employee.calculation_snapshot || {};
  const percentages = snapshot.applied_rule?.percentages || snapshot || {};
  const isPaid = employee.salary_status === 'PAID';

  const formatUsd = (val?: number | string | null): string => {
    const num = Number(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm">
              AC
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">ACME Corporation</h3>
              <p className="text-[11px] text-slate-400">Monthly Compensation Statement</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status & Period Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Pay Period: </span>
              <span className="font-bold text-slate-800">
                November 2026
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payment Status: </span>
              {isPaid ? (
                <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> PAID & FINALIZED
                </span>
              ) : (
                <span className="inline-flex items-center font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  DRAFT / ESTIMATE
                </span>
              )}
            </div>
          </div>

          {/* Employee Demographic Details Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee Name</span>
              <span className="font-bold text-slate-900">{employee.first_name} {employee.last_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee ID</span>
              <span className="font-mono font-bold text-amber-600">{employee.employee_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
              <span className="font-medium text-slate-800">{employee.department_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Designation</span>
              <span className="font-medium text-slate-800">{employee.role_title}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Seniority Tier</span>
              <span className="font-semibold text-indigo-600">{employee.role_level}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Country Location</span>
              <span className="font-medium text-slate-800">{employee.country_code}</span>
            </div>
          </div>

          {/* Itemized Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3.5 py-2 font-bold text-xs text-slate-700 border-b border-slate-200">
                Monthly Earnings
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-600">Base Salary ({percentages.base_percentage || 50}%)</span>
                  <span className="font-semibold text-slate-900">{formatUsd(employee.base_salary)}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-600">Allowances ({percentages.allowance_percentage || 25}%)</span>
                  <span className="font-semibold text-slate-900">{formatUsd(employee.allowance)}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-600">Performance Bonus ({percentages.bonus_percentage || 15}%)</span>
                  <span className="font-semibold text-slate-900">{formatUsd(employee.bonus)}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2 bg-slate-50 font-bold text-slate-900">
                  <span>Gross Monthly Earnings</span>
                  <span className="text-indigo-600">{formatUsd(employee.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3.5 py-2 font-bold text-xs text-slate-700 border-b border-slate-200">
                Statutory Deductions & Taxes
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-600">Tax Withholding ({percentages.deduction_percentage || 12}%)</span>
                  <span className="font-semibold text-rose-600">-{formatUsd(employee.tax_deduction)}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-600">Employer Retirals/PF ({percentages.employer_retirals_percentage || 10}%)</span>
                  <span className="font-semibold text-slate-500">{formatUsd(employee.employer_retirals)}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2 bg-slate-50 font-bold text-slate-900">
                  <span>Total Deductions</span>
                  <span className="text-rose-600">-{formatUsd(employee.tax_deduction)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Take-Home Highlight Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide block">
                Net Take-Home Pay (Disbursed)
              </span>
              <span className="text-[11px] text-emerald-600">Gross Earnings minus Statutory Tax Deductions</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {formatUsd(employee.net_salary)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow-xs cursor-pointer transition-all"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
}
