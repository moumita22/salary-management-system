import React from 'react';
import { DollarSign, Lock, Play, UserMinus, Users } from 'lucide-react';
import MonthYearPicker from './MonthYearPicker.js';
import type { SalaryStatus } from '../types/index.js';

export interface HeaderProps {
  activeView: 'directory' | 'exits';
  setActiveView: (view: 'directory' | 'exits') => void;
  payoutPeriod?: { month: number; year: number };
  onPeriodChange?: (val: { month: number; year: number }) => void;
  onGeneratePayroll: () => void;
  onDisbursePayroll: () => void;
  isGenerating: boolean;
  isDisbursing: boolean;
  payrollStatus: SalaryStatus | string;
  exitsCount?: number;
  filteredCount?: number;
  isFiltered?: boolean;
}

export default function Header({
  activeView,
  setActiveView,
  payoutPeriod,
  onPeriodChange,
  onGeneratePayroll,
  onDisbursePayroll,
  isGenerating,
  isDisbursing,
  payrollStatus,
  exitsCount = 0,
  filteredCount = 0,
  isFiltered = false,
}: HeaderProps): React.JSX.Element {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">ACME</span>
                <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  SMS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Salary Management System</p>
            </div>
          </div>

          {/* Active Period & View Switcher */}
          <div className="flex items-center space-x-3">
            {/* Cycle Selector (Month/Year Calendar Picker) */}
            <div className="hidden md:flex items-center space-x-2">
              {onPeriodChange && payoutPeriod && (
                <MonthYearPicker
                  value={payoutPeriod}
                  onChange={onPeriodChange}
                  variant="header"
                />
              )}
              {payrollStatus === 'PAID' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Lock className="w-3 h-3 mr-1" /> Paid & Locked
                </span>
              ) : payrollStatus === 'EMPTY' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                  Uncalculated
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  Draft Mode
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm">
              <button
                type="button"
                onClick={() => setActiveView('directory')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'directory'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Directory</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('exits')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'exits'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserMinus className="w-4 h-4" />
                <span>Exits & Settlements</span>
                {exitsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-rose-100 text-rose-700 font-bold">
                    {exitsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isGenerating || payrollStatus === 'PAID'}
              onClick={onGeneratePayroll}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs ${
                payrollStatus === 'PAID'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isGenerating
                  ? 'Generating...'
                  : isFiltered && filteredCount > 0
                  ? `⚡ Generate Payroll (${filteredCount.toLocaleString()})`
                  : '⚡ Generate Monthly Payroll'}
              </span>
            </button>

            <button
              type="button"
              disabled={isDisbursing || payrollStatus === 'PAID'}
              onClick={onDisbursePayroll}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all border shadow-xs ${
                payrollStatus === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 cursor-pointer active:scale-98'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {isDisbursing ? 'Locking...' : payrollStatus === 'PAID' ? '🔒 Payday Locked' : 'Simulate Payday'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
