import React, { useState } from 'react';
import { X, Save, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import type { Employee } from '../types/index.js';
import { formatUsd } from '../utils/index.js';

export interface SalaryEditModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: (
    employeeId: number,
    payload: { customAdditions: Array<{ name: string; amount: number }> }
  ) => void;
  isSaving?: boolean;
}

export default function SalaryEditModal({
  employee,
  onClose,
  onSave,
  isSaving = false,
}: SalaryEditModalProps): React.JSX.Element | null {
  const [spotBonus, setSpotBonus] = useState<number>(Number(employee?.added_bonus) || 0);

  if (!employee) return null;

  const baseSalary = Number(employee.base_salary) || 0;
  const allowance = Number(employee.allowance) || 0;
  const bonus = Number(employee.bonus) || 0;

  // Retrieve deduction percentage from snapshot or default 12%
  const snapshot = employee.calculation_snapshot;
  const deductionPct = snapshot?.deduction_percentage || 12;

  // Live recalculations
  const contractualSubtotal = baseSalary + allowance + bonus;
  const grossSalary = Number((contractualSubtotal + spotBonus).toFixed(2));
  const taxDeduction = Number((grossSalary * (deductionPct / 100)).toFixed(2));
  const netSalary = Number((grossSalary - taxDeduction).toFixed(2));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee.id, {
      customAdditions: spotBonus > 0 ? [{ name: 'Added Bonus', amount: spotBonus }] : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm tracking-tight text-white">Adjust Compensation</h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                {employee.employee_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {employee.first_name} {employee.last_name} • {employee.job_title || employee.department_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Read-Only Contractual Salary Details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Contractual Pay Components
              </label>
              <span className="text-[10px] text-slate-400 flex items-center">
                <Lock className="w-3 h-3 mr-0.5 text-slate-400" /> Policy Locked
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Base Salary
                </span>
                <p className="text-xs font-bold text-slate-800">{formatUsd(baseSalary)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Allowance
                </span>
                <p className="text-xs font-bold text-slate-800">{formatUsd(allowance)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Monthly Bonus
                </span>
                <p className="text-xs font-bold text-slate-800">{formatUsd(bonus)}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Base, allowance, and contractual monthly bonus are locked by compensation policy bands.
            </p>
          </div>

          {/* Editable Added Bonus Input */}
          <div className="pt-1 border-t border-slate-100">
            <label className="block text-xs font-semibold text-blue-900 mb-1 flex items-center justify-between">
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-blue-600" /> Added Bonus ($)
              </span>
              <span className="text-[10px] font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Discretionary / Spot
              </span>
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={spotBonus === 0 ? '' : spotBonus}
                placeholder="0.00"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSpotBonus(isNaN(val) || val < 0 ? 0 : val);
                }}
                autoFocus
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-blue-50/40 border border-blue-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enter any one-off performance award, referral payout, or spot bonus for this payroll cycle.
            </p>
          </div>

          {/* Real-time Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Contractual Pay Subtotal:</span>
              <span className="font-semibold text-slate-700">{formatUsd(contractualSubtotal)}</span>
            </div>
            {spotBonus > 0 && (
              <div className="flex justify-between text-blue-700 font-medium">
                <span className="flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-600" /> Added Bonus:
                </span>
                <span className="font-bold">+{formatUsd(spotBonus)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Recalculated Gross Pay:</span>
              <span className="font-bold text-slate-900">{formatUsd(grossSalary)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Deduction ({deductionPct}%):</span>
              <span className="font-semibold text-rose-600">-{formatUsd(taxDeduction)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
              <span>Updated Net Take-Home:</span>
              <span className="text-emerald-600 text-sm">{formatUsd(netSalary)}</span>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow-xs cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-98 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Adjustments'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
