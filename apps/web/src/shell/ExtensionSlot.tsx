import { Component, type ReactNode, useSyncExternalStore } from 'react';
import { extensionRegistry } from '@/lib/extension-registry';

interface ExtensionSlotProps {
  name: string;
  context?: Record<string, unknown>;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ExtensionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function ExtensionSlot({ name, context }: ExtensionSlotProps) {
  const extensions = useSyncExternalStore(
    (cb) => extensionRegistry.subscribe(cb),
    () => extensionRegistry.get(name),
  );

  if (extensions.length === 0) return null;

  return (
    <>
      {extensions.map((ext, i) => {
        const Comp = ext.component;
        return (
          <ExtensionErrorBoundary key={i}>
            <Comp {...context} />
          </ExtensionErrorBoundary>
        );
      })}
    </>
  );
}
