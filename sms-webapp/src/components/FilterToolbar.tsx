import React from 'react';
import { Search, Globe, Award, X, Play, Lock } from 'lucide-react';
import type { SalaryStatus, CycleMetrics } from '../types/index.js';
import { COUNTRIES, LEVELS } from '../utils/index.js';

export interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  countryCode: string;
  onCountryChange: (val: string) => void;
  level: string;
  onLevelChange: (val: string) => void;
  onResetFilters: () => void;
  totalResults?: number;
  onGeneratePayroll?: () => void;
  onDisbursePayroll?: () => void;
  isGenerating?: boolean;
  isDisbursing?: boolean;
  payrollStatus?: SalaryStatus | string;
  selectedDeptId?: string;
  cycleMetrics?: CycleMetrics | null;
  filteredCount?: number;
  isFiltered?: boolean;
}

export default function FilterToolbar({
  searchQuery,
  onSearchChange,
  countryCode,
  onCountryChange,
  level,
  onLevelChange,
  onResetFilters,
  totalResults = 0,
  onGeneratePayroll,
  onDisbursePayroll,
  isGenerating = false,
  isDisbursing = false,
  payrollStatus = 'EMPTY',
  selectedDeptId = '',
  cycleMetrics = null,
  filteredCount = 0,
  isFiltered = false,
}: FilterToolbarProps): React.JSX.Element {
  const hasActiveFilters = Boolean(searchQuery || countryCode || level);
  const isDeptFiltered = Boolean(selectedDeptId);
  const isAllGenerated = Boolean(
    cycleMetrics &&
      cycleMetrics.total_eligible > 0 &&
      cycleMetrics.total_records >= cycleMetrics.total_eligible
  );

  let paydayTooltip = '';
  let isPaydayDisabled = isDisbursing || payrollStatus === 'PAID';

  if (isDeptFiltered) {
    isPaydayDisabled = true;
    paydayTooltip = 'Payday disbursement must be executed from All Departments';
  } else if (payrollStatus === 'PAID') {
    paydayTooltip = 'Payday has already been disbursed and locked for this cycle';
  } else if (cycleMetrics && !isAllGenerated) {
    isPaydayDisabled = true;
    paydayTooltip = `Cannot disburse: only ${cycleMetrics.total_records.toLocaleString()} of ${cycleMetrics.total_eligible.toLocaleString()} employees generated. Generate all departments first.`;
  }

  return (
    <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or EMP ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons (Between Search and Country Filter) */}
          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
            {onGeneratePayroll && (
              <button
                type="button"
                disabled={isGenerating || payrollStatus === 'PAID'}
                onClick={onGeneratePayroll}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                  payrollStatus === 'PAID'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isGenerating
                    ? 'Generating...'
                    : isFiltered && filteredCount > 0
                    ? `⚡ Generate Payroll (${filteredCount.toLocaleString()})`
                    : '⚡ Generate Monthly Payroll'}
                </span>
              </button>
            )}

            {onDisbursePayroll && (
              <button
                type="button"
                disabled={isPaydayDisabled}
                title={paydayTooltip || 'Simulate month-end payday & lock records'}
                onClick={onDisbursePayroll}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
                  payrollStatus === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                    : isPaydayDisabled
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 cursor-pointer active:scale-98'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isDisbursing ? 'Locking...' : payrollStatus === 'PAID' ? '🔒 Payday Locked' : 'Simulate Payday'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center flex-wrap gap-2 w-full xl:w-auto justify-end">
          {/* Country Filter */}
          <div className="relative flex items-center">
            <Globe className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={countryCode}
              onChange={(e) => onCountryChange(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all appearance-none"
            >
              <option value="">🌍 All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seniority Level Filter */}
          <div className="relative flex items-center">
            <Award className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={level}
              onChange={(e) => onLevelChange(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all appearance-none"
            >
              <option value="">🎖️ All Seniorities</option>
              {LEVELS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Results Summary Counter */}
          <div className="text-xs font-medium text-slate-500 pl-2">
            Showing <span className="font-bold text-slate-900">{totalResults.toLocaleString()}</span> employees
          </div>
        </div>
      </div>
    </div>
  );
}
