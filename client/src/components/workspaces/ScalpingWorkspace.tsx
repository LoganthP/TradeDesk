import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useMultiChartStore } from '@/store/useMultiChartStore';
import { WorkspacePanel } from './WorkspaceShared';
import { useRef } from 'react';

export function ScalpingWorkspace() {
  const { panels, activePanelId } = useMultiChartStore();
  const chartRegistry = useRef({});

  // Retrieve persistent workspace panels from the store
  const mainPanel = panels.find(p => p.id === 'scalping-main') || panels[0];
  const domPanel = panels.find(p => p.id === 'scalping-dom') || panels[1];

  return (
    <div className="w-full h-full p-1 bg-border-primary/20">
      <PanelGroup orientation="horizontal">
        <Panel defaultSize={70} minSize={30}>
          <WorkspacePanel 
            panel={mainPanel} 
            isActive={activePanelId === mainPanel.id} 
            chartRegistry={chartRegistry} 
          />
        </Panel>
        
        <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-blue/50 transition-colors cursor-col-resize z-10" />
        
        <Panel defaultSize={30} minSize={20}>
          <WorkspacePanel 
            panel={{ ...domPanel, symbol: mainPanel.symbol }} 
            isActive={activePanelId === domPanel.id} 
            chartRegistry={chartRegistry} 
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
