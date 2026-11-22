import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
}: PaginationProps): React.JSX.Element {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      {/* Items range and page size selector */}
      <div className="flex items-center space-x-3">
        <span>
          Showing <span className="font-semibold text-slate-900">{startItem.toLocaleString()}</span> to{' '}
          <span className="font-semibold text-slate-900">{endItem.toLocaleString()}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalItems.toLocaleString()}</span> employees
        </span>

        <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            currentPage <= 1
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 cursor-pointer shadow-xs active:scale-95'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1 rounded-lg bg-slate-100 font-semibold text-slate-800">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            currentPage >= totalPages
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 cursor-pointer shadow-xs active:scale-95'
          }`}
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
