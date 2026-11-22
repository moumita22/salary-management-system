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
      <div className="w-full flex items-center">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs mr-2 shrink-0 cursor-pointer transition-colors"
          title="Scroll left"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>

        {/* Scrollable Pills Container */}
        <div
          ref={scrollRef}
          className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1.5"
        >
          {/* "All Departments" Pill */}
          <button
            type="button"
            onClick={() => onSelectDepartment('')}
            className={`flex items-center space-x-2 px-4.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-xs ${
              selectedDeptId === ''
                ? 'bg-blue-600 text-white shadow-md ring-3 ring-blue-500/25'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Departments</span>
          </button>

          {/* Department Pills */}
          {departments.map((dept) => {
            const isSelected = selectedDeptId === dept.department_id;
            return (
              <button
                key={dept.department_id}
                type="button"
                onClick={() => onSelectDepartment(dept.department_id)}
                className={`flex items-center space-x-2 px-4.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md ring-3 ring-blue-500/25'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <span>{dept.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs ml-2 shrink-0 cursor-pointer transition-colors"
          title="Scroll right"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
