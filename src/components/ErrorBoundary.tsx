"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <h2 className="text-xl font-semibold text-[var(--text-accent)] tracking-wide mb-3">
            抱朴守拙
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
            页面暂时出了点问题，请刷新重试。
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--text-accent)] hover:text-[var(--text-accent)] transition-colors"
          >
            重新来过
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
