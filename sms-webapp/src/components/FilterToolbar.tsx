import React from 'react';
import { Search, Globe, Award, X } from 'lucide-react';
import MonthYearPicker, { MonthYearValue } from './MonthYearPicker.js';

const COUNTRIES = [
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'SG', name: '🇸🇬 Singapore' },
];

const LEVELS = [
  { code: 'JUNIOR', name: 'Junior Tier' },
  { code: 'MID_LEVEL', name: 'Mid-Level' },
  { code: 'SENIOR', name: 'Senior / Lead' },
];

export interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  countryCode: string;
  onCountryChange: (val: string) => void;
  level: string;
  onLevelChange: (val: string) => void;
  payoutPeriod?: MonthYearValue;
  onPeriodChange?: (val: MonthYearValue) => void;
  onResetFilters: () => void;
  totalResults?: number;
}

export default function FilterToolbar({
  searchQuery,
  onSearchChange,
  countryCode,
  onCountryChange,
  level,
  onLevelChange,
  payoutPeriod,
  onPeriodChange,
  onResetFilters,
  totalResults = 0,
}: FilterToolbarProps): React.JSX.Element {
  const hasActiveFilters = Boolean(searchQuery || countryCode || level);

  return (
    <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
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

        {/* Filter Dropdowns */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Month & Year Selection Calendar */}
          {payoutPeriod && onPeriodChange && (
            <MonthYearPicker
              value={payoutPeriod}
              onChange={onPeriodChange}
              variant="toolbar"
            />
          )}

          {/* Country Filter (India First) */}
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

          {/* Level Filter */}
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
