import { useMultiChartStore } from '@/store/useMultiChartStore';
import { WorkspacePanel } from './WorkspaceShared';
import { useRef } from 'react';

export function StandardWorkspace() {
  const { panels, activePanelId } = useMultiChartStore();
  const chartRegistry = useRef({});

  // Ensure we have 4 panels to show
  const displayPanels = panels.slice(0, 4);

  return (
    <div className="w-full h-full p-1 bg-border-primary/20">
      <div 
        className="w-full h-full grid gap-1"
        style={{
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(2, minmax(0, 1fr))'
        }}
      >
        {displayPanels.map((panel) => (
          <WorkspacePanel 
            key={panel.id} 
            panel={panel} 
            isActive={panel.id === activePanelId} 
            chartRegistry={chartRegistry} 
          />
        ))}
      </div>
    </div>
  );
}
