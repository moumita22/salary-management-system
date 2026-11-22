import React from 'react';
import { UserMinus, Calculator, CheckCircle2, Clock } from 'lucide-react';
import type { Employee } from '../types/index.js';

export interface SettlementViewProps {
  exits: Employee[];
  onGenerateSettlement: (employeeId: number) => void;
  loading?: boolean;
  generatingId?: number | null;
}

export default function SettlementView({
  exits = [],
  onGenerateSettlement,
  loading = false,
  generatingId = null,
}: SettlementViewProps): React.JSX.Element {
  const formatUsd = (val?: number | string | null): string => {
    const num = Number(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Exits & Mid-Month Settlements (LWD)</h3>
            <p className="text-xs text-slate-500">
              Prorated compensation for employees exiting ACME before month-end
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {exits.length} Pending Exits
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading exiting employees...
        </div>
      ) : exits.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No exiting employees with last working days found for this cycle.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Last Working Day</th>
                <th className="py-3.5 px-4">Days Worked</th>
                <th className="py-3.5 px-4">Monthly Gross</th>
                <th className="py-3.5 px-4">Prorated Gross</th>
                <th className="py-3.5 px-4">Net Settlement</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {exits.map((emp) => {
                const isSettled = emp.salary_status === 'PAID';
                const daysInMonth = 30; // standard month
                const exitDay = emp.last_working_day
                  ? parseInt(emp.last_working_day.split('-')[2], 10)
                  : 15;
                const annualCtc = Number(emp.annual_ctc) || 0;
                const monthlyGross = (annualCtc / 12) * 0.9;
                const proratedGross = (monthlyGross / daysInMonth) * exitDay;
                const netSettlement = proratedGross * 0.88;

                return (
                  <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</div>
                      <div className="font-mono text-[11px] text-amber-600 font-semibold">{emp.employee_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{emp.role_title}</div>
                      <div className="text-[11px] text-slate-500">{emp.department_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                        <Clock className="w-3 h-3 mr-1" />
                        {emp.last_working_day}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{exitDay}</span>
                      <span className="text-slate-400"> / {daysInMonth} days</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatUsd(emp.gross_salary || monthlyGross)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {formatUsd((emp as any).prorated_gross || proratedGross)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 font-mono text-sm">
                      {formatUsd(emp.net_salary || netSettlement)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isSettled ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Settled
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={generatingId === emp.id}
                          onClick={() => onGenerateSettlement(emp.id)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95 shadow-xs transition-all"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>{generatingId === emp.id ? 'Calculating...' : 'Generate Settlement'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
