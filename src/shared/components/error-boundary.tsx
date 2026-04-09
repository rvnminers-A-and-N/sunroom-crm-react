import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <AlertTriangle className="h-12 w-12 text-sr-coral mb-4" />
          <h2 className="text-xl font-semibold text-sr-text mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            An unexpected error occurred. Please try again or refresh the page.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-sr-primary hover:bg-sr-primary-dark"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
