"use client";
import * as React from "react";

interface SafeBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  resetKeys?: any[];
  onRetry?: () => void;
}

interface SafeBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SafeBoundary extends React.Component<SafeBoundaryProps, SafeBoundaryState> {
  constructor(props: SafeBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: SafeBoundaryProps) {
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      JSON.stringify(this.props.resetKeys) !== JSON.stringify(prevProps.resetKeys)
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-destructive">
          <div className="font-bold text-lg">{this.props.title || "Something went wrong"}</div>
          <div className="text-sm opacity-80 mb-2">{this.props.description || this.state.error?.message}</div>
          <button
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition"
            onClick={this.handleRetry}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SafeBoundary;
