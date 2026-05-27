import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useMultiChartStore } from '@/store/useMultiChartStore';
import { WorkspacePanel } from './WorkspaceShared';
import { useRef } from 'react';

export function CryptoWorkspace() {
  const { panels, activePanelId } = useMultiChartStore();
  const chartRegistry = useRef({});

  const heatmapPanel = panels.find(p => p.id === 'crypto-heatmap') || panels[0];
  const btcPanel = panels.find(p => p.id === 'crypto-btc') || panels[1];
  const ethPanel = panels.find(p => p.id === 'crypto-eth') || panels[2];
  const solPanel = panels.find(p => p.id === 'crypto-sol') || panels[3];
  const adaPanel = panels.find(p => p.id === 'crypto-ada') || panels[4];

  return (
    <div className="w-full h-full p-1 bg-border-primary/20">
      <PanelGroup orientation="horizontal">
        {/* Left Side: Heatmap */}
        <Panel defaultSize={30} minSize={20}>
          <WorkspacePanel 
            panel={heatmapPanel} 
            isActive={activePanelId === heatmapPanel.id} 
            chartRegistry={chartRegistry} 
          />
        </Panel>
        
        <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-blue/50 transition-colors cursor-col-resize z-10" />
        
        {/* Right Side: 2x2 Crypto Grid */}
        <Panel defaultSize={70} minSize={30}>
          <div 
            className="w-full h-full grid gap-1"
            style={{
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(2, minmax(0, 1fr))'
            }}
          >
            <WorkspacePanel panel={btcPanel} isActive={activePanelId === btcPanel.id} chartRegistry={chartRegistry} />
            <WorkspacePanel panel={ethPanel} isActive={activePanelId === ethPanel.id} chartRegistry={chartRegistry} />
            <WorkspacePanel panel={solPanel} isActive={activePanelId === solPanel.id} chartRegistry={chartRegistry} />
            <WorkspacePanel panel={adaPanel} isActive={activePanelId === adaPanel.id} chartRegistry={chartRegistry} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
