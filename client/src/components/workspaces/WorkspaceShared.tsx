import { cn } from '@/lib/utils';
import { useMultiChartStore, type ChartPanelState } from '@/store/useMultiChartStore';
import { ChartPanelHeader } from '../chart/ChartPanelHeader';
import { ChartModule, DOMBookPanel, HeatmapPanel } from '../chart/ChartModules';
import { WatchlistPanel } from '../watchlist/WatchlistPanel';
import { NewsPanel } from '../panels/NewsPanel';
import { CalendarPanel } from '../panels/CalendarPanel';

export function WorkspacePanel({ 
  panel, 
  isActive, 
  onClose, 
  chartRegistry 
}: { 
  panel: ChartPanelState; 
  isActive?: boolean;
  onClose?: () => void;
  chartRegistry: any;
}) {
  const { setActivePanelId, setMaximizedPanelId, removePanel } = useMultiChartStore();
  
  return (
    <div 
      onClick={() => setActivePanelId(panel.id)}
      className={cn(
        "relative w-full h-full bg-bg-void flex flex-col min-h-0 min-w-0 transition-all border overflow-hidden",
        isActive 
          ? "ring-2 ring-blue/80 ring-inset border-blue/40 shadow-[0_0_12px_rgba(0,122,255,0.2)] z-10" 
          : "border-border-primary/20 hover:border-border-primary/50"
      )}
    >
      <ChartPanelHeader 
        panel={panel} 
        isActive={!!isActive}
        onMaximizeToggle={() => setMaximizedPanelId(panel.id)}
        onClose={onClose || (() => removePanel(panel.id))}
        onSwap={() => {}} // simplified for specialized workspaces
      />
      <div className="flex-1 min-h-0 w-full h-full relative">
        {panel.type === 'chart' ? (
          <ChartModule panel={panel} isActive={isActive} chartRegistry={chartRegistry} />
        ) : panel.type === 'watchlist' ? (
          <WatchlistPanel />
        ) : panel.type === 'news' ? (
          <NewsPanel />
        ) : panel.type === 'calendar' ? (
          <CalendarPanel />
        ) : panel.type === 'orderbook' ? (
          <DOMBookPanel symbol={panel.symbol} />
        ) : panel.type === 'heatmap' ? (
          <HeatmapPanel />
        ) : (
          <ChartModule panel={panel} isActive={isActive} chartRegistry={chartRegistry} />
        )}
      </div>
    </div>
  );
}
