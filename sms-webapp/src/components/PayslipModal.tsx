import React from 'react';
import { X, Printer, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import type { Employee } from '../types/index.js';
import { formatUsd, parseDate, formatPayPeriod, getDaysInMonth } from '../utils/index.js';

export interface PayslipModalProps {
  employee: Employee | null;
  payoutPeriod?: { month: number; year: number };
  onClose: () => void;
}

export default function PayslipModal({ employee, payoutPeriod, onClose }: PayslipModalProps): React.JSX.Element | null {
  if (!employee) return null;

  const snapshot = employee.calculation_snapshot;
  const isPaid = employee.salary_status === 'PAID';

  const payPeriodText = payoutPeriod
    ? formatPayPeriod(payoutPeriod.month, payoutPeriod.year)
    : 'November 2026';

  const isProrated = Boolean(snapshot?.is_prorated || employee.last_working_day);
  const lwdInfo = employee.last_working_day ? parseDate(employee.last_working_day) : null;
  const cycleDays = payoutPeriod ? getDaysInMonth(payoutPeriod.month, payoutPeriod.year) : 30;
  const totalDays = snapshot?.total_working_days || cycleDays;
  const actualDays = snapshot?.actual_days_worked ?? (lwdInfo && lwdInfo.day > 0 ? lwdInfo.day : totalDays);

  const basePct = snapshot?.base_percentage || 50;
  const allowancePct = snapshot?.allowance_percentage || 25;
  const bonusPct = snapshot?.bonus_percentage || 15;
  const retiralsPct = snapshot?.employer_retirals_percentage || 10;
  const deductionPct = snapshot?.deduction_percentage || 12;

  // Safe denominator preventing division by zero
  const contractualPctSum = (basePct + allowancePct + bonusPct) || 100;

  // Direct values with smart fallback to snapshot or proration calculation
  const baseSalary = employee.base_salary ?? snapshot.base_salary;
  const allowance = employee.allowance ?? snapshot.allowance;
  const bonus = employee.bonus ?? snapshot.bonus;
  const employerRetirals = employee.employer_retirals ?? snapshot.employer_retirals;

  const resolvedBaseSalary =
    baseSalary !== null && baseSalary !== undefined
      ? baseSalary
      : employee.gross_salary && basePct
      ? Number((Number(employee.gross_salary) * (basePct / contractualPctSum)).toFixed(2))
      : 0;

  const resolvedAllowance =
    allowance !== null && allowance !== undefined
      ? allowance
      : employee.gross_salary && allowancePct
      ? Number((Number(employee.gross_salary) * (allowancePct / contractualPctSum)).toFixed(2))
      : 0;

  const resolvedBonus =
    bonus !== null && bonus !== undefined
      ? bonus
      : employee.gross_salary && bonusPct
      ? Number((Number(employee.gross_salary) * (bonusPct / contractualPctSum)).toFixed(2))
      : 0;

  const resolvedRetirals =
    employerRetirals !== null && employerRetirals !== undefined && Number(employerRetirals) > 0
      ? employerRetirals
      : employee.gross_salary && retiralsPct
      ? Number((Number(employee.gross_salary) * (retiralsPct / contractualPctSum)).toFixed(2))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xs">
              AC
            </div>
            <div>
              <h3 className="font-bold text-xs tracking-tight text-white">ACME Corporation</h3>
              <p className="text-[10px] text-slate-400">Monthly Compensation Statement</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-all cursor-pointer"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Compact) */}
        <div className="p-4 space-y-3 text-xs">
          {/* Status & Pay Period Bar */}
          <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Period:</span>
              <span className="font-bold text-slate-800">{payPeriodText}</span>
              {isProrated && (
                <span className="inline-flex items-center font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px] border border-amber-200">
                  <Clock className="w-3 h-3 mr-1" /> {actualDays}/{totalDays} Days Proration
                </span>
              )}
            </div>
            <div>
              {isPaid ? (
                <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> PAID & FINALIZED
                </span>
              ) : (
                <span className="inline-flex items-center font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                  DRAFT / ESTIMATE
                </span>
              )}
            </div>
          </div>

          {/* Employee Demographic Details (Compact 3x2 Grid) */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Employee</span>
              <span className="font-bold text-slate-900 truncate block">
                {employee.first_name} {employee.last_name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Employee ID</span>
              <span className="font-mono font-bold text-amber-600">{employee.employee_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Department</span>
              <span className="font-medium text-slate-800 truncate block">{employee.department_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Designation</span>
              <span className="font-medium text-slate-800 truncate block">{employee.role_title}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Tier / Location</span>
              <span className="font-semibold text-indigo-600">
                {employee.role_level} <span className="text-slate-400 font-normal">({employee.country_code})</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">
                {employee.last_working_day ? 'Last Working Day' : 'Annual CTC'}
              </span>
              <span className={`font-semibold ${employee.last_working_day ? 'text-rose-600 font-mono' : 'text-slate-800'}`}>
                {employee.last_working_day ? lwdInfo?.text : formatUsd(employee.annual_ctc)}
              </span>
            </div>
          </div>

          {/* Itemized Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200">
                Monthly Earnings
              </div>
              <div className="divide-y divide-slate-100 text-[11px]">
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">Base Salary ({basePct}%)</span>
                  <span className="font-semibold text-slate-900">{formatUsd(resolvedBaseSalary)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">Allowances ({allowancePct}%)</span>
                  <span className="font-semibold text-slate-900">{formatUsd(resolvedAllowance)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">Bonus ({bonusPct}%)</span>
                  <span className="font-semibold text-slate-900">{formatUsd(resolvedBonus)}</span>
                </div>
                {Number(employee.added_bonus) > 0 && (
                  <div className="flex justify-between px-3 py-1.5 bg-blue-50/70 text-blue-900 border-l-2 border-blue-500">
                    <span className="font-semibold flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-blue-600" /> Added Bonus
                    </span>
                    <span className="font-bold text-blue-700">+{formatUsd(employee.added_bonus)}</span>
                  </div>
                )}
                <div className="flex justify-between px-3 py-1.5 bg-slate-50 font-bold text-slate-900">
                  <span>Gross Earnings</span>
                  <span className="text-indigo-600">{formatUsd(employee.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200">
                Statutory Deductions & Retirals
              </div>
              <div className="divide-y divide-slate-100 text-[11px]">
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">Tax Withholding ({deductionPct}%)</span>
                  <span className="font-semibold text-rose-600">-{formatUsd(employee.tax_deduction)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-600">Employer Retirals/PF ({retiralsPct}%)</span>
                  <span className="font-semibold text-slate-600">{formatUsd(resolvedRetirals)}</span>
                </div>
                <div className="flex justify-between px-3 py-1.5 bg-slate-50 font-bold text-slate-900">
                  <span>Total Deductions</span>
                  <span className="text-rose-600">-{formatUsd(employee.tax_deduction)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Take-Home Highlight Card (Compact) */}
          <div className="p-3 px-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                Net Take-Home Pay (Disbursed)
              </span>
              <span className="text-[10px] text-emerald-600">Gross Earnings minus Statutory Tax Deductions</span>
            </div>
            <div className="text-xl font-black text-emerald-700 tracking-tight">
              {formatUsd(employee.net_salary)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
}

