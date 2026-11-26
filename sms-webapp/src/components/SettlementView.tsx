import React, { useState, useMemo } from 'react';
import { UserMinus, Calculator, FileText, Lock, AlertCircle, Clock, CreditCard, Filter } from 'lucide-react';
import type { Employee } from '../types/index.js';
import { formatUsd, parseDate, getLevelBadgeClass, getDaysInMonth, formatDateTime, getTodayIsoDate } from '../utils/index.js';

export interface SettlementViewProps {
  exits: Employee[];
  payoutPeriod?: { month: number; year: number };
  onGenerateSettlement: (employeeId: number) => void;
  onDisburseSettlement?: (employeeId: number) => void;
  onViewPayslip?: (employee: Employee) => void;
  loading?: boolean;
  generatingId?: number | null;
  disbursingId?: number | null;
}

export default function SettlementView({
  exits = [],
  payoutPeriod,
  onGenerateSettlement,
  onDisburseSettlement,
  onViewPayslip,
  loading = false,
  generatingId = null,
  disbursingId = null,
}: SettlementViewProps): React.JSX.Element {

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const totalDaysInMonth = payoutPeriod ? getDaysInMonth(payoutPeriod.month, payoutPeriod.year) : 30;

  const [todayStr] = useState<string>(() => getTodayIsoDate());

  const pendingCount = exits.filter((e) => e.status === 'EXITING').length;
  const terminatedCount = exits.filter((e) => e.status === 'TERMINATED').length;

  const filteredExits = useMemo(() => {
    let result = exits;
    if (statusFilter !== 'ALL') {
      result = result.filter((e) => e.status === statusFilter);
    }
    return [...result].sort((a, b) => {
      if (a.status === 'EXITING' && b.status !== 'EXITING') return -1;
      if (a.status !== 'EXITING' && b.status === 'EXITING') return 1;
      const dateA = a.last_working_day || '';
      const dateB = b.last_working_day || '';
      return dateA.localeCompare(dateB);
    });
  }, [exits, statusFilter]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm shadow-xs animate-pulse">
        <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-semibold text-slate-700">Loading exiting employees...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching exit records for this cycle</p>
      </div>
    );
  }

  if (exits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="font-bold text-slate-800 text-sm">No exiting employees for this cycle</h4>
        <p className="text-xs text-slate-500 mt-1">There are no employees with designated last working days in this month</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Summary Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Exits & Mid-Month Settlements (LWD)</h3>
            <p className="text-xs text-slate-500">
              Prorated exit pay calculations for employees leaving before month-end
            </p>
          </div>
        </div>

        {/* Right Controls: Status Dropdown Filter + Count Badge */}
        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses ({exits.length})</option>
              <option value="EXITING">Active Exiting ({pendingCount})</option>
              <option value="TERMINATED">Terminated ({terminatedCount})</option>
            </select>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            {filteredExits.length} Employee{filteredExits.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Main Table Matching EmployeeTable Design */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-3">Role & Department</th>
              <th className="py-3.5 px-3 text-center">Last Working Day</th>
              <th className="py-3.5 px-3 text-center">Days Worked</th>
              <th className="py-3.5 px-3 text-right">Annual CTC</th>
              <th className="py-3.5 px-3 text-right">Prorated Gross</th>
              <th className="py-3.5 px-3 text-right">Total Deduction</th>
              <th className="py-3.5 px-3 text-right">Net Settlement</th>
              <th className="py-3.5 px-3 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-xs">
            {filteredExits.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                  No exiting employees found with status "{statusFilter}".
                </td>
              </tr>
            ) : (
              filteredExits.map((emp) => {
              const hasSalary = emp.gross_salary !== null && emp.gross_salary !== undefined;
              const isPaid = emp.salary_status === 'PAID';
              const dateInfo = parseDate(emp.last_working_day);
              const daysInMonth = emp.calculation_snapshot?.total_working_days ?? totalDaysInMonth;
              const actualDaysWorked = emp.calculation_snapshot?.actual_days_worked ?? dateInfo.day;
              const cleanLwd = emp.last_working_day ? String(emp.last_working_day).split('T')[0] : '';
              const isLwdPassed = Boolean(cleanLwd && cleanLwd < todayStr);

              return (
                <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name & ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-sm text-slate-900">
                      {emp.first_name} {emp.last_name}
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] mt-0.5">
                      <span className="font-mono font-bold text-blue-600">{emp.employee_id}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 truncate max-w-[140px]">{emp.email}</span>
                    </div>
                  </td>

                  {/* Role & Department */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-xs">{emp.role_title}</div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-[11px] text-slate-500 font-medium">{emp.department_name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold text-[9px] border ${getLevelBadgeClass(
                          emp.role_level
                        )}`}
                      >
                        {emp.role_level}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold text-[9px] border ${
                          emp.status === 'TERMINATED'
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>
                  </td>

                  {/* Last Working Day */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                      <Clock className="w-3 h-3 mr-1" />
                      {dateInfo.text}
                    </span>
                  </td>

                  {/* Days Worked */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="font-bold text-slate-900">{actualDaysWorked}</span>
                    <span className="text-slate-400 text-[11px]"> / {daysInMonth} days</span>
                  </td>

                  {/* Annual CTC */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {formatUsd(emp.annual_ctc)}
                  </td>

                  {/* Prorated Gross */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {hasSalary ? formatUsd(emp.gross_salary) : '—'}
                  </td>

                  {/* Total Deduction */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
                    {hasSalary && emp.tax_deduction ? `-${formatUsd(emp.tax_deduction)}` : '—'}
                  </td>

                  {/* Net Settlement */}
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-600 text-sm whitespace-nowrap">
                    {hasSalary ? formatUsd(emp.net_salary) : '—'}
                  </td>

                  {/* Status Badge (Matching EmployeeTable Design) */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {isPaid ? (
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Lock className="w-3 h-3 mr-1" /> Paid
                        </span>
                        {emp.paid_at && (
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5" title={`Disbursed: ${formatDateTime(emp.paid_at)}`}>
                            {formatDateTime(emp.paid_at)}
                          </span>
                        )}
                      </div>
                    ) : hasSalary ? (
                      <div className="flex flex-col items-center space-y-1">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Draft
                        </span>
                        {isLwdPassed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                            Pending Settlement
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Uncalculated
                        </span>
                        {isLwdPassed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                            Pending Settlement
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Action Buttons (Matching EmployeeTable Design) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      {/* View Payslip Button */}
                      {onViewPayslip && (
                        <button
                          type="button"
                          disabled={!hasSalary}
                          onClick={() => onViewPayslip(emp)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                            hasSalary
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 cursor-pointer active:scale-95'
                              : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200'
                          }`}
                          title="View Prorated Settlement Statement"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Payslip</span>
                        </button>
                      )}

                      {/* Generate / Recalculate Settlement Button */}
                      {isPaid ? (
                        <span
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold cursor-default"
                          title="Settlement has been disbursed and permanently locked"
                        >
                          <Lock className="w-3.5 h-3.5 mr-0.5" />
                          <span>Paid & Locked</span>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={generatingId === emp.id || disbursingId === emp.id}
                            onClick={() => onGenerateSettlement(emp.id)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all ${
                              hasSalary
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                            title={hasSalary ? 'Recalculate Prorated Settlement' : 'Generate Exit Settlement'}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>
                              {generatingId === emp.id
                                ? 'Calculating...'
                                : hasSalary
                                ? 'Recalculate'
                                : 'Generate Settlement'}
                            </span>
                          </button>

                          {/* Disburse Individual Settlement Button */}
                          {hasSalary && onDisburseSettlement && (
                            <button
                              type="button"
                              disabled={disbursingId === emp.id || generatingId === emp.id}
                              onClick={() => onDisburseSettlement(emp.id)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                              title="Disburse and permanently lock this exit settlement"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>
                                {disbursingId === emp.id ? 'Disbursing...' : 'Disburse Settlement'}
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
