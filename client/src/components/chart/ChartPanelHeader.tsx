import { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, RefreshCw, X, ChevronDown, Link2, Link2Off } from 'lucide-react';
import { useMultiChartStore, type ChartPanelState, type PanelType } from '@/store/useMultiChartStore';
import { cn } from '@/lib/utils';
import { normalizeTimeframe } from '@/api/prices';

interface ChartPanelHeaderProps {
  panel: ChartPanelState;
  isActive: boolean;
  onMaximizeToggle: () => void;
  onClose: () => void;
  onSwap: () => void;
}

export function ChartPanelHeader({
  panel,
  isActive,
  onMaximizeToggle,
  onClose,
  onSwap,
}: ChartPanelHeaderProps) {
  const { 
    updatePanel, 
    syncSymbol, 
    syncTimeframe, 
    toggleSync, 
    activeWorkspace,
    maximizedPanelId 
  } = useMultiChartStore();
  
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const panelTypes: { type: PanelType; label: string; icon: string }[] = [
    { type: 'chart', label: 'Chart', icon: '📈' },
    { type: 'orderbook', label: 'DOM Book', icon: '🛡️' },
    { type: 'heatmap', label: 'Heatmap', icon: '🗺️' },
  ];

  const allPanelTypes: { type: PanelType; label: string; icon: string }[] = [
    ...panelTypes,
    { type: 'watchlist', label: 'Watchlist', icon: '📋' },
    { type: 'news', label: 'News', icon: '📰' },
    { type: 'calendar', label: 'Calendar', icon: '📅' },
  ];

  const currentType = allPanelTypes.find(t => t.type === panel.type) || allPanelTypes[0];
  const isSwitchable = ['chart', 'orderbook', 'heatmap'].includes(panel.type);

  return (
    <div 
      onDoubleClick={onMaximizeToggle}
      className={cn(
        "flex items-center justify-between px-3 h-9 bg-bg-base border-b border-border-primary/50 text-[13px] z-10 transition-colors shrink-0 select-none",
        isActive ? "border-blue/40 bg-bg-surface/50" : "bg-bg-base"
      )}
    >
      {/* Left: Active dot, Pane Type Dropdown, Symbol search, Timeframe dropdown */}
      <div className="flex items-center gap-2">
        <div 
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            isActive ? "bg-blue shadow-[0_0_8px_#007aff]" : "bg-text-muted/40"
          )} 
        />

        {/* Panel Type Selector Dropdown */}
        <div className="relative shrink-0" ref={typeDropdownRef}>
          {isSwitchable ? (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTypeDropdown(!showTypeDropdown); }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-bg-hover text-text-primary text-[11px] font-bold border border-border-subtle hover:border-border-focus transition-colors"
            >
              <span className="text-[12px]">{currentType.icon}</span>
              <span className="hidden xs:inline">{currentType.label}</span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-elevated/50 text-text-muted text-[10px] font-bold uppercase tracking-wider border border-border-primary/50">
              <span className="text-[11px]">{currentType.icon}</span>
              <span>{currentType.label}</span>
            </div>
          )}

          {isSwitchable && showTypeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-bg-elevated border border-border-primary rounded shadow-xl py-1 z-30">
              {panelTypes.map(t => (
                <button
                  key={t.type}
                  onClick={() => { updatePanel(panel.id, { type: t.type }); setShowTypeDropdown(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-[11px] hover:bg-bg-hover text-text-primary flex gap-2 items-center",
                    panel.type === t.type && "text-blue font-bold"
                  )}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Symbol and Timeframe options */}
        {panel.type === 'chart' && (
          <div className="flex items-center gap-1">
            <span className="font-bold text-text-primary uppercase px-1 py-0.5 hover:bg-bg-hover rounded cursor-pointer">{panel.symbol}</span>
            <span className="text-text-muted text-[11px] font-medium">{normalizeTimeframe(panel.timeframe)}</span>
          </div>
        )}
      </div>

      {/* Right: Sync states & Panel controls */}
      <div className="flex items-center gap-1.5">
        {/* Sync Controls (Visible when not Single layout) */}
        <div className="flex items-center gap-0.5 border-r border-border-primary/50 pr-1.5 mr-0.5">
          <button 
            onClick={() => toggleSync('symbol')}
            className={cn(
              "p-1 rounded hover:bg-bg-hover transition-colors",
              syncSymbol ? "text-blue" : "text-text-muted hover:text-text-primary"
            )}
            title={syncSymbol ? "Symbols are Linked" : "Link Symbols"}
          >
            {syncSymbol ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={() => toggleSync('timeframe')}
            className={cn(
              "p-1 rounded hover:bg-bg-hover transition-colors",
              syncTimeframe ? "text-blue" : "text-text-muted hover:text-text-primary"
            )}
            title={syncTimeframe ? "Timeframes are Linked" : "Link Timeframes"}
          >
            <span className="text-[9px] font-bold">TF</span>
          </button>
        </div>

        {/* Swap Button */}
        {activeWorkspace === 'standard' && (
          <button 
            onClick={onSwap}
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
            title="Swap Layout Position"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Maximize / Restore Toggle */}
        <button 
          onClick={onMaximizeToggle}
          className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
          title={maximizedPanelId === panel.id ? "Restore Window" : "Maximize Window"}
        >
          {maximizedPanelId === panel.id ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Close Button (Visible when layout is split/grid) */}
        {activeWorkspace === 'standard' && (
          <button 
            onClick={onClose}
            className="p-1 text-text-muted hover:text-red rounded hover:bg-bg-hover transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
