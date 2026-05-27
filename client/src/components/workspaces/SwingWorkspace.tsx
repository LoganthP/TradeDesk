import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useMultiChartStore } from '@/store/useMultiChartStore';
import { WorkspacePanel } from './WorkspaceShared';
import { useRef } from 'react';

export function SwingWorkspace() {
  const { panels, activePanelId } = useMultiChartStore();
  const chartRegistry = useRef({});

  // Retrieve persistent workspace panels from the store
  const mainPanel = panels.find(p => p.id === 'swing-main') || panels[0];
  const confPanel = panels.find(p => p.id === 'swing-conf') || panels[1];

  return (
    <div className="w-full h-full p-1 bg-border-primary/20">
      <PanelGroup orientation="horizontal">
        {/* Right Side: Charts */}
        <Panel defaultSize={100} minSize={100}>
          <PanelGroup orientation="vertical">
            <Panel defaultSize={70} minSize={30}>
              <WorkspacePanel 
                panel={mainPanel} 
                isActive={activePanelId === mainPanel.id} 
                chartRegistry={chartRegistry} 
              />
            </Panel>
            
            <PanelResizeHandle className="h-1.5 bg-transparent hover:bg-blue/50 transition-colors cursor-row-resize z-10" />
            
            <Panel defaultSize={30} minSize={20}>
              <WorkspacePanel 
                panel={{ ...confPanel, symbol: mainPanel.symbol }} 
                isActive={activePanelId === confPanel.id} 
                chartRegistry={chartRegistry} 
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
