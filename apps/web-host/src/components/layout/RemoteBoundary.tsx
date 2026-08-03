'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { Spinner } from '@/components/ui';

interface Props {
  children: ReactNode;
  name: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RemoteBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[RemoteBoundary:${this.props.name}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
          <p className="text-sm">
            The <span className="font-medium">{this.props.name}</span> module failed to load.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-brand-600 hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RemoteLoader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
      <Spinner size="lg" />
    </div>
  );
}
