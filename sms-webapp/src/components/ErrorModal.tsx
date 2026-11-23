import React, { useEffect } from 'react';

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  statusCode?: number;
  code?: string;
  isCodeIssue?: boolean;
  timestamp?: string;
  onRetry?: () => void;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  statusCode = 500,
  code = 'ServerError',
  isCodeIssue,
  timestamp,
  onRetry,
}: ErrorModalProps): React.JSX.Element | null {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine if this is a severe system/code issue
  const isSevere = isCodeIssue ?? (statusCode >= 500 || statusCode === 0 || code === 'ServerError' || code === 'DatabaseError');

  // Friendly status label
  const getStatusLabel = (code: number) => {
    switch (code) {
      case 0:
        return 'Network Offline';
      case 400:
        return '400 • Bad Request';
      case 401:
        return '401 • Unauthorized';
      case 403:
        return '403 • Forbidden';
      case 404:
        return '404 • Not Found';
      case 409:
        return '409 • Conflict';
      case 422:
        return '422 • Unprocessable';
      case 500:
        return '500 • Internal Server Error';
      case 502:
        return '502 • Bad Gateway';
      case 503:
        return '503 • Service Unavailable';
      default:
        return `${code} • Error`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isSevere ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg ${
              isSevere ? 'bg-rose-600 text-white shadow-sm shadow-rose-200' : 'bg-amber-600 text-white shadow-sm shadow-amber-200'
            }`}>
              {isSevere ? '🚨' : '⚠️'}
            </div>
            <div>
              <h3 className={`text-base font-bold ${isSevere ? 'text-rose-900' : 'text-amber-900'}`}>
                {title || (isSevere ? 'System / Code Error' : 'Action Failed')}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                  isSevere ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  HTTP {getStatusLabel(statusCode)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close error modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Main Error Message */}
          <div className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
            {message}
          </div>

          {/* Contact Developer Callout for Code / 500 Issues */}
          {isSevere && (
            <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-rose-600 font-bold text-sm">🛠️</span>
                <div>
                  <p className="font-bold text-rose-900">
                    Software Code Issue Encountered
                  </p>
                  <p className="text-rose-700 text-[11px] mt-0.5 leading-normal">
                    An unexpected system issue was detected. Please <span className="font-semibold underline">contact the developer</span> with the error details below.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-800 font-mono">
                <span>Code: <strong>{code}</strong></span>
                {timestamp && <span>Time: <strong>{timestamp}</strong></span>}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {onRetry && (
            <button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 shadow-sm transition-all"
            >
              🔄 Retry Action
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all ${
              isSevere
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                : 'bg-slate-800 hover:bg-slate-900 active:scale-95'
            }`}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
