import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import type { Department } from '../types/index.js';

export interface DepartmentPillsProps {
  departments: Department[];
  selectedDeptId: string;
  onSelectDepartment: (deptId: string) => void;
  totalEmployees?: number;
}

export default function DepartmentPills({
  departments = [],
  selectedDeptId = '',
  onSelectDepartment,
  totalEmployees = 10000,
}: DepartmentPillsProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-xs mr-2 shrink-0 cursor-pointer"
          title="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Pills Container */}
        <div
          ref={scrollRef}
          className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1"
        >
          {/* "All Departments" Pill */}
          <button
            type="button"
            onClick={() => onSelectDepartment('')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              selectedDeptId === ''
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Departments</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedDeptId === ''
                  ? 'bg-amber-600/60 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totalEmployees.toLocaleString()}
            </span>
          </button>

          {/* Department Pills */}
          {departments.map((dept) => {
            const isSelected = selectedDeptId === dept.department_id;
            return (
              <button
                key={dept.department_id}
                type="button"
                onClick={() => onSelectDepartment(dept.department_id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{dept.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-amber-600/60 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {Number(dept.employee_count || 0).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-xs ml-2 shrink-0 cursor-pointer"
          title="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
