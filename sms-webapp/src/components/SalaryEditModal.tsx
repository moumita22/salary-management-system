import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import type { Employee } from '../types/index.js';

export interface SalaryEditModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: (employeeId: number, payload: any) => void;
  isSaving?: boolean;
}

export default function SalaryEditModal({
  employee,
  onClose,
  onSave,
  isSaving = false,
}: SalaryEditModalProps): React.JSX.Element | null {
  const [baseSalary, setBaseSalary] = useState<number>(Number(employee?.base_salary) || 0);
  const [allowance, setAllowance] = useState<number>(Number(employee?.allowance) || 0);
  const [bonus, setBonus] = useState<number>(Number(employee?.bonus) || 0);
  const [spotBonus, setSpotBonus] = useState<number>(0);

  useEffect(() => {
    if (employee) {
      setBaseSalary(Number(employee.base_salary) || 0);
      setAllowance(Number(employee.allowance) || 0);
      setBonus(Number(employee.bonus) || 0);
      setSpotBonus(0);
    }
  }, [employee]);

  if (!employee) return null;

  // Retrieve deduction percentage from snapshot or default 12%
  const snapshot: any = employee.calculation_snapshot || {};
  const deductionPct =
    snapshot.applied_rule?.percentages?.deduction_percentage ||
    snapshot.deduction_percentage ||
    12;

  // Live recalculations
  const grossSalary = Number((baseSalary + allowance + bonus + spotBonus).toFixed(2));
  const taxDeduction = Number((grossSalary * (deductionPct / 100)).toFixed(2));
  const netSalary = Number((grossSalary - taxDeduction).toFixed(2));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee.id, {
      overrides: {
        base_salary: baseSalary,
        allowance: allowance,
        bonus: bonus,
        tax_deduction: taxDeduction,
      },
      customAdditions: spotBonus > 0 ? [{ name: 'Spot / Performance Bonus', amount: spotBonus }] : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white">Adjust Compensation</h3>
            <p className="text-xs text-slate-400">
              {employee.first_name} {employee.last_name} ({employee.employee_id})
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Base Salary ($)</label>
              <input
                type="number"
                step="0.01"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Allowance ($)</label>
              <input
                type="number"
                step="0.01"
                value={allowance}
                onChange={(e) => setAllowance(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Bonus ($)</label>
              <input
                type="number"
                step="0.01"
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-amber-700 mb-1 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Spot Bonus ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={spotBonus}
                onChange={(e) => setSpotBonus(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200 font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Recalculated Gross Pay:</span>
              <span className="font-bold text-slate-900">${grossSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Deduction ({deductionPct}%):</span>
              <span className="font-semibold text-rose-600">-${taxDeduction.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
              <span>Updated Net Take-Home:</span>
              <span className="text-emerald-600 text-sm">${netSalary.toLocaleString()}</span>
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
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-98 transition-all"
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
