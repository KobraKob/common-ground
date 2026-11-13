'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onReset?: () => void;
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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}] Caught error:`, error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-2xl celestial-card border border-rose-500/30 bg-rose-950/20 my-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-900/40 border border-rose-500/40 flex items-center justify-center mx-auto mb-3 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F8F7FF] mb-1 font-display">
            {this.props.name ? `Something went wrong in ${this.props.name}` : 'Something went wrong'}
          </h3>
          <p className="text-xs text-[#C4B5FD] font-sans max-w-md mx-auto mb-4">
            {this.state.error?.message || 'An unexpected rendering error occurred. The rest of the page is still working.'}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-xs font-mono font-bold text-amber-300 border border-purple-400/40 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
