import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useMultiChartStore } from '@/store/useMultiChartStore';
import { WorkspacePanel } from './WorkspaceShared';
import { useRef } from 'react';

export function CorrelationWorkspace() {
  const { panels, activePanelId } = useMultiChartStore();
  const chartRegistry = useRef({});

  const spyPanel = panels.find(p => p.id === 'corr-spy') || panels[0];
  const qqqPanel = panels.find(p => p.id === 'corr-qqq') || panels[1];
  const aaplPanel = panels.find(p => p.id === 'corr-aapl') || panels[2];
  const tslaPanel = panels.find(p => p.id === 'corr-tsla') || panels[3];

  return (
    <div className="w-full h-full p-1 bg-border-primary/20">
      <PanelGroup orientation="vertical">
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup orientation="horizontal">
            <Panel defaultSize={50} minSize={20}>
              <WorkspacePanel panel={spyPanel} isActive={activePanelId === spyPanel.id} chartRegistry={chartRegistry} />
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-blue/50 transition-colors cursor-col-resize z-10" />
            <Panel defaultSize={50} minSize={20}>
              <WorkspacePanel panel={qqqPanel} isActive={activePanelId === qqqPanel.id} chartRegistry={chartRegistry} />
            </Panel>
          </PanelGroup>
        </Panel>
        
        <PanelResizeHandle className="h-1.5 bg-transparent hover:bg-blue/50 transition-colors cursor-row-resize z-10" />
        
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup orientation="horizontal">
            <Panel defaultSize={50} minSize={20}>
              <WorkspacePanel panel={aaplPanel} isActive={activePanelId === aaplPanel.id} chartRegistry={chartRegistry} />
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-blue/50 transition-colors cursor-col-resize z-10" />
            <Panel defaultSize={50} minSize={20}>
              <WorkspacePanel panel={tslaPanel} isActive={activePanelId === tslaPanel.id} chartRegistry={chartRegistry} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
