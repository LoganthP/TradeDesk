import { useMultiChartStore } from '@/store/useMultiChartStore';
import { StandardWorkspace } from '../workspaces/StandardWorkspace';
import { ScalpingWorkspace } from '../workspaces/ScalpingWorkspace';
import { SwingWorkspace } from '../workspaces/SwingWorkspace';
import { CryptoWorkspace } from '../workspaces/CryptoWorkspace';
import { CorrelationWorkspace } from '../workspaces/CorrelationWorkspace';
import { DOMWorkspace } from '../workspaces/DOMWorkspace';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export function ChartContainer() {
  const { activeWorkspace } = useMultiChartStore();

  let WorkspaceComponent;
  switch (activeWorkspace) {
    case 'scalping': WorkspaceComponent = ScalpingWorkspace; break;
    case 'swing': WorkspaceComponent = SwingWorkspace; break;
    case 'crypto': WorkspaceComponent = CryptoWorkspace; break;
    case 'correlation': WorkspaceComponent = CorrelationWorkspace; break;
    case 'dom': WorkspaceComponent = DOMWorkspace; break;
    case 'standard':
    default: WorkspaceComponent = StandardWorkspace; break;
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-bg-void flex flex-col min-h-0 min-w-0">
        <WorkspaceComponent />
      </div>
    </ErrorBoundary>
  );
}
