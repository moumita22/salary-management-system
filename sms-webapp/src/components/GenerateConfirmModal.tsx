import React from 'react';
import { X } from 'lucide-react';
import { formatPayPeriod } from '../utils/index.js';

export interface BonusRecipient {
  employee_id: string;
  added_bonus: number;
}

export interface GenerateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isGenerating: boolean;
  payoutPeriod: { month: number; year: number };
  targetLabel: string;
  bonusRecipients: BonusRecipient[];
}

export default function GenerateConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isGenerating,
  payoutPeriod,
  targetLabel,
  bonusRecipients = [],
}: GenerateConfirmModalProps): React.JSX.Element | null {
  if (!isOpen) return null;

  const periodText = formatPayPeriod(payoutPeriod.month, payoutPeriod.year);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Generate Payroll</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Generate <strong className="text-slate-900">{periodText}</strong> payroll for{' '}
            <strong className="text-slate-900">{targetLabel}</strong> using database policy rules?
          </p>

          {bonusRecipients.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-1.5">
              <p className="font-medium text-slate-800">
                Added bonuses will be preserved for {bonusRecipients.length} employee(s):
              </p>
              <p className="font-mono text-[11px] text-slate-600">
                {bonusRecipients
                  .map(
                    (b) =>
                      `${b.employee_id} (+$${Number(b.added_bonus).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })})`
                  )
                  .join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-white cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isGenerating}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
