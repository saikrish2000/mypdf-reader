import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  name: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`${this.props.name} panel crashed:`, error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-sm text-muted-foreground text-center">
          {this.props.name} panel encountered an error. Close and reopen to try again.
        </div>
      );
    }
    return this.props.children;
  }
}
