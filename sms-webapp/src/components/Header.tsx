import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DollarSign, Lock, UserMinus, Users, Briefcase, UserCheck, LogOut } from 'lucide-react';
import MonthYearPicker from './MonthYearPicker.js';
import type { SalaryStatus, CycleMetrics } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

export interface HeaderProps {
  activeView?: 'directory' | 'exits';
  setActiveView?: (view: 'directory' | 'exits') => void;
  payoutPeriod?: { month: number; year: number };
  onPeriodChange?: (val: { month: number; year: number }) => void;
  payrollStatus?: SalaryStatus | string;
  cycleMetrics?: CycleMetrics | null;
  exitsCount?: number;
}

export default function Header({
  activeView = 'directory',
  setActiveView,
  payoutPeriod,
  onPeriodChange,
  payrollStatus = 'DRAFT',
  cycleMetrics = null,
  exitsCount = 0,
}: HeaderProps): React.JSX.Element {
  const location = useLocation();
  const { username, user, logout } = useAuth();
  const isSalaryPage = location.pathname.includes('/salary_management');
  const isEmployeePage = location.pathname.includes('/employee_management');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Primary Navigation Links */}
          <div className="flex items-center space-x-6 shrink-0">
            <Link to="/salary_management" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <DollarSign className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">ACME</span>
                  <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    SMS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Enterprise Management</p>
              </div>
            </Link>

            {/* Page Navigation Links */}
            <nav className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <Link
                to="/salary_management"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isSalaryPage
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Salary Management</span>
              </Link>
              <Link
                to="/employee_management"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isEmployeePage
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Employee Management</span>
              </Link>
            </nav>
          </div>

          {/* Right Section: Salary Controls (if on salary page), Username & Logout */}
          <div className="flex items-center space-x-3 shrink-0">
            {isSalaryPage && (
              <>
                {/* Payroll Cycle Selector & Status Hub */}
                <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {onPeriodChange && payoutPeriod && (
                    <MonthYearPicker
                      value={payoutPeriod}
                      onChange={onPeriodChange}
                      variant="header"
                    />
                  )}
                  {payrollStatus === 'PAID' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Lock className="w-3 h-3 mr-1" /> Paid & Locked
                    </span>
                  ) : payrollStatus === 'PARTIAL' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      Partial ({cycleMetrics ? `${cycleMetrics.paid_count.toLocaleString()}/${cycleMetrics.total_eligible.toLocaleString()}` : ''} Paid)
                    </span>
                  ) : payrollStatus === 'EMPTY' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 text-slate-600 border border-slate-300">
                      Uncalculated
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Draft Mode
                    </span>
                  )}
                </div>

                {/* Sub-view switcher: Directory / Exits */}
                {setActiveView && (
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveView('directory')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        activeView === 'directory'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Directory</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('exits')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        activeView === 'exits'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Exits</span>
                      {exitsCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                          {exitsCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Username & Logout on Every Page Header */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                {user?.full_name || username || 'Admin'}
              </span>
              <button
                type="button"
                onClick={logout}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Sign out of SMS"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
