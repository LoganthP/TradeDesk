import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useMultiChartStore } from '@/store/useMultiChartStore';
import { WorkspacePanel } from './WorkspaceShared';
import { useRef } from 'react';

export function DOMWorkspace() {
  const { panels, activePanelId } = useMultiChartStore();
  const chartRegistry = useRef({});

  // Retrieve persistent workspace panels from the store
  const mainPanel = panels.find(p => p.id === 'dom-main') || panels[0];
  const domPanel = panels.find(p => p.id === 'dom-ladder') || panels[1];

  return (
    <div className="w-full h-full p-1 bg-border-primary/20">
      <PanelGroup orientation="horizontal">
        {/* Left Side: DOM Ladder */}
        <Panel defaultSize={25} minSize={20}>
          <WorkspacePanel 
            panel={{ ...domPanel, symbol: mainPanel.symbol }} 
            isActive={activePanelId === domPanel.id} 
            chartRegistry={chartRegistry} 
          />
        </Panel>
        
        <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-blue/50 transition-colors cursor-col-resize z-10" />
        
        {/* Center: Main Execution Chart */}
        <Panel defaultSize={75} minSize={30}>
          <WorkspacePanel 
            panel={mainPanel} 
            isActive={activePanelId === mainPanel.id} 
            chartRegistry={chartRegistry} 
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
