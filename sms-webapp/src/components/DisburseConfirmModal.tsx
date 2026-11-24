import React from 'react';
import { X } from 'lucide-react';
import { formatPayPeriod } from '../utils/index.js';

export interface DisburseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDisbursing: boolean;
  payoutPeriod: { month: number; year: number };
}

export default function DisburseConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isDisbursing,
  payoutPeriod,
}: DisburseConfirmModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  const periodText = formatPayPeriod(payoutPeriod.month, payoutPeriod.year);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Simulate Payday</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isDisbursing}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-2.5 text-xs text-slate-600 leading-relaxed">
          <p>
            Simulate month-end payday for <strong className="text-slate-900">{periodText}</strong>?
          </p>
          <p className="text-slate-500">
            All employee salaries for this cycle will be marked as <strong className="text-slate-700">PAID</strong> and locked against further edits.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDisbursing}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-white cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDisbursing}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
          >
            {isDisbursing ? 'Locking...' : 'Confirm Payday'}
          </button>
        </div>
      </div>
    </div>
  );
}
