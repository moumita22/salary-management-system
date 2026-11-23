import React from 'react';
import { UserMinus, Calculator, FileText, Lock, AlertCircle, Clock, CreditCard } from 'lucide-react';
import type { Employee } from '../types/index.js';
import { formatUsd, parseDate, getLevelBadgeClass } from '../utils/index.js';

export interface SettlementViewProps {
  exits: Employee[];
  onGenerateSettlement: (employeeId: number) => void;
  onDisburseSettlement?: (employeeId: number) => void;
  onViewPayslip?: (employee: Employee) => void;
  loading?: boolean;
  generatingId?: number | null;
  disbursingId?: number | null;
}

export default function SettlementView({
  exits = [],
  onGenerateSettlement,
  onDisburseSettlement,
  onViewPayslip,
  loading = false,
  generatingId = null,
  disbursingId = null,
}: SettlementViewProps): React.JSX.Element {

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
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Exits & Mid-Month Settlements (LWD)</h3>
            <p className="text-xs text-slate-500">
              Prorated exit pay calculations for employees leaving before month-end
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {exits.length} Exiting Employee{exits.length === 1 ? '' : 's'}
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
            {exits.map((emp) => {
              const hasSalary = emp.gross_salary !== null && emp.gross_salary !== undefined;
              const isPaid = emp.salary_status === 'PAID';
              const dateInfo = parseDate(emp.last_working_day);
              const daysInMonth = 30; // standard calendar reference

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
                    <span className="font-bold text-slate-900">{dateInfo.day}</span>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
