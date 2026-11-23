import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorModal from './ErrorModal.js';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[React ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleClose = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <ErrorModal
            isOpen={true}
            onClose={this.handleClose}
            title="UI Runtime Crash"
            message={this.state.error?.message || 'An unexpected frontend component error occurred.'}
            statusCode={500}
            code="ReactRenderError"
            isCodeIssue={true}
            onRetry={this.handleReload}
          />
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 font-bold">
              🚨
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-6">
              A UI rendering error occurred. Please contact the developer if this persists after reload.
            </p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-md transition-all"
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
