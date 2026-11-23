import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { MONTHS_SHORT, MONTHS_LONG } from '../utils/index.js';

export interface MonthYearValue {
  month: number; // 1-12
  year: number;  // e.g. 2026
}

export interface MonthYearPickerProps {
  value: MonthYearValue;
  onChange: (value: MonthYearValue) => void;
  className?: string;
  variant?: 'toolbar' | 'header';
}

export default function MonthYearPicker({
  value,
  onChange,
  className = '',
  variant = 'toolbar',
}: MonthYearPickerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [navYear, setNavYear] = useState<number>(value.year);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen) {
      setNavYear(value.year);
    }
    setIsOpen((prev) => !prev);
  };

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    onChange({ month: monthIndex + 1, year: navYear });
    setIsOpen(false);
  };

  const currentMonthLabel = `${MONTHS_LONG[value.month - 1]} ${value.year}`;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={
          variant === 'header'
            ? 'flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-xs'
            : 'flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-xs'
        }
        title="Change Payout Month & Year"
      >
        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-bold">{currentMonthLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-64 p-3 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Year Navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setNavYear((prev) => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              title="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm text-slate-900">{navYear}</span>
            <button
              type="button"
              onClick={() => setNavYear((prev) => prev + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              title="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Grid (3 cols x 4 rows) */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS_SHORT.map((mName, idx) => {
              const isSelected = value.month === idx + 1 && value.year === navYear;
              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 px-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange({ month: 10, year: 2026 });
                setIsOpen(false);
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Oct 2026
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ month: 11, year: 2026 });
                setIsOpen(false);
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Nov 2026
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onChange({ month: now.getMonth() + 1, year: now.getFullYear() });
                setIsOpen(false);
              }}
              className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Current
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
