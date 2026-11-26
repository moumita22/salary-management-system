import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getVisiblePages } from '../utils/pagination.js';

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
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  const visiblePages = useMemo(
    () => getVisiblePages(safeCurrentPage, safeTotalPages),
    [safeCurrentPage, safeTotalPages],
  );

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      {/* Items range and page size selector */}
      <div className="flex flex-wrap items-center gap-3">
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

      {/* Numbered Page Navigation Controls */}
      <nav aria-label="Pagination" className="flex items-center space-x-1">
        {/* Previous Button */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          aria-label="Previous Page"
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            safeCurrentPage <= 1
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 cursor-pointer shadow-2xs active:scale-95'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Visible Page Number Buttons and Ellipsis */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((item, idx) => {
            if (item === 'dots-start' || item === 'dots-end') {
              return (
                <span
                  key={`${item}-${idx}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 select-none font-bold"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isCurrent = item === safeCurrentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={`min-w-7 h-7 sm:min-w-8 sm:h-8 px-1.5 flex items-center justify-center rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200 font-medium cursor-pointer active:scale-95'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={safeCurrentPage >= safeTotalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          aria-label="Next Page"
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            safeCurrentPage >= safeTotalPages
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 cursor-pointer shadow-2xs active:scale-95'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </nav>
    </div>
  );
}
