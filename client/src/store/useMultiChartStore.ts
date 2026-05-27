import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PanelType = 'chart' | 'watchlist' | 'orderbook' | 'news' | 'calendar' | 'heatmap';

export interface ChartPanelState {
  id: string;
  type: PanelType;
  symbol: string;
  timeframe: string;
  indicators: string[];
  drawings: any[];
}

export type WorkspaceType = 'standard' | 'dom' | 'scalping' | 'swing' | 'crypto' | 'correlation';

interface MultiChartState {
  activeWorkspace: WorkspaceType;
  
  // Standard panels (fallback for old layouts)
  panels: ChartPanelState[];
  activePanelId: string;
  
  // Sync states
  syncSymbol: boolean;
  syncTimeframe: boolean;
  syncCrosshair: boolean;
  syncIndicators: boolean;
  
  // Maximize states
  maximizedPanelId: string | null;
  
  // Actions
  setWorkspace: (workspace: WorkspaceType) => void;
  setActivePanelId: (id: string) => void;
  updatePanel: (id: string, updates: Partial<ChartPanelState>) => void;
  toggleSync: (type: 'symbol' | 'timeframe' | 'crosshair' | 'indicators') => void;
  setMaximizedPanelId: (id: string | null) => void;
  swapPanels: (id1: string, id2: string) => void;
  removePanel: (id: string) => void;
  duplicatePanel: (id: string) => void;
  resetLayout: () => void;
}

const DEFAULT_PANELS: ChartPanelState[] = [
  // Standard workspace panels
  { id: 'panel-0', type: 'chart', symbol: 'AAPL', timeframe: '1D', indicators: ['Vol', 'EMA9'], drawings: [] },
  { id: 'panel-1', type: 'chart', symbol: 'TSLA', timeframe: '1H', indicators: ['Vol', 'EMA21'], drawings: [] },
  { id: 'panel-2', type: 'chart', symbol: 'NVDA', timeframe: '5m', indicators: ['Vol', 'EMA50'], drawings: [] },
  { id: 'panel-3', type: 'chart', symbol: 'MSFT', timeframe: '15m', indicators: ['Vol', 'BB'], drawings: [] },

  // Scalping workspace panels
  { id: 'scalping-main', type: 'chart', symbol: 'BTC/USD', timeframe: '1m', indicators: ['Vol'], drawings: [] },
  { id: 'scalping-dom', type: 'orderbook', symbol: 'BTC/USD', timeframe: '1m', indicators: [], drawings: [] },

  // Swing workspace panels
  { id: 'swing-main', type: 'chart', symbol: 'AAPL', timeframe: '1D', indicators: ['Vol', 'EMA9'], drawings: [] },
  { id: 'swing-conf', type: 'chart', symbol: 'AAPL', timeframe: '4H', indicators: ['Vol'], drawings: [] },
  { id: 'swing-watch', type: 'watchlist', symbol: 'AAPL', timeframe: '1D', indicators: [], drawings: [] },

  // Crypto workspace panels
  { id: 'crypto-heatmap', type: 'heatmap', symbol: 'MARKETS', timeframe: '1D', indicators: [], drawings: [] },
  { id: 'crypto-btc', type: 'chart', symbol: 'BTC/USD', timeframe: '15m', indicators: ['Vol'], drawings: [] },
  { id: 'crypto-eth', type: 'chart', symbol: 'ETH/USD', timeframe: '15m', indicators: ['Vol'], drawings: [] },
  { id: 'crypto-sol', type: 'chart', symbol: 'SOL/USD', timeframe: '15m', indicators: ['Vol'], drawings: [] },
  { id: 'crypto-ada', type: 'chart', symbol: 'ADA/USD', timeframe: '15m', indicators: ['Vol'], drawings: [] },

  // Correlation workspace panels
  { id: 'corr-spy', type: 'chart', symbol: 'SPY', timeframe: '1D', indicators: ['Vol'], drawings: [] },
  { id: 'corr-qqq', type: 'chart', symbol: 'QQQ', timeframe: '1D', indicators: ['Vol'], drawings: [] },
  { id: 'corr-aapl', type: 'chart', symbol: 'AAPL', timeframe: '1D', indicators: ['Vol'], drawings: [] },
  { id: 'corr-tsla', type: 'chart', symbol: 'TSLA', timeframe: '1D', indicators: ['Vol'], drawings: [] },

  // DOM workspace panels
  { id: 'dom-main', type: 'chart', symbol: 'ES1!', timeframe: '5m', indicators: ['Vol'], drawings: [] },
  { id: 'dom-ladder', type: 'orderbook', symbol: 'ES1!', timeframe: '5m', indicators: [], drawings: [] },
  { id: 'dom-watch', type: 'watchlist', symbol: 'ES1!', timeframe: '1D', indicators: [], drawings: [] },
];

export const useMultiChartStore = create<MultiChartState>()(
  persist(
    (set) => ({
      activeWorkspace: 'standard',
      panels: DEFAULT_PANELS,
      activePanelId: 'panel-0',
      
      syncSymbol: false,
      syncTimeframe: false,
      syncCrosshair: true,
      syncIndicators: false,
      
      maximizedPanelId: null,
      
      setWorkspace: (workspace) => {
        set((state) => {
          let activePanelId = state.activePanelId;
          switch (workspace) {
            case 'standard': activePanelId = 'panel-0'; break;
            case 'scalping': activePanelId = 'scalping-main'; break;
            case 'swing': activePanelId = 'swing-main'; break;
            case 'crypto': activePanelId = 'crypto-btc'; break;
            case 'correlation': activePanelId = 'corr-spy'; break;
            case 'dom': activePanelId = 'dom-main'; break;
          }
          return { activeWorkspace: workspace, activePanelId, maximizedPanelId: null };
        });
      },
      
      setActivePanelId: (id) => {
        set({ activePanelId: id });
      },
      
      updatePanel: (id, updates) => {
        set((state) => {
          const syncSym = state.syncSymbol && updates.symbol !== undefined;
          const syncTf = state.syncTimeframe && updates.timeframe !== undefined;
          const syncInd = state.syncIndicators && updates.indicators !== undefined;
          
          const updatedPanels = state.panels.map((p) => {
            if (p.id === id) {
              return { ...p, ...updates };
            }
            
            // Sync logic
            const syncUpdates: Partial<ChartPanelState> = {};
            if (syncSym) syncUpdates.symbol = updates.symbol;
            if (syncTf) syncUpdates.timeframe = updates.timeframe;
            if (syncInd) syncUpdates.indicators = updates.indicators;
            
            if (Object.keys(syncUpdates).length > 0) {
              return { ...p, ...syncUpdates };
            }
            return p;
          });
          
          return { panels: updatedPanels };
        });
      },
      
      toggleSync: (type) => {
        set((state) => {
          if (type === 'symbol') {
            const newVal = !state.syncSymbol;
            const active = state.panels.find((p) => p.id === state.activePanelId) || state.panels[0];
            const panels = newVal 
              ? state.panels.map(p => ({ ...p, symbol: active.symbol }))
              : state.panels;
            return { syncSymbol: newVal, panels };
          }
          if (type === 'timeframe') {
            const newVal = !state.syncTimeframe;
            const active = state.panels.find((p) => p.id === state.activePanelId) || state.panels[0];
            const panels = newVal 
              ? state.panels.map(p => ({ ...p, timeframe: active.timeframe }))
              : state.panels;
            return { syncTimeframe: newVal, panels };
          }
          if (type === 'indicators') {
            const newVal = !state.syncIndicators;
            const active = state.panels.find((p) => p.id === state.activePanelId) || state.panels[0];
            const panels = newVal 
              ? state.panels.map(p => ({ ...p, indicators: active.indicators }))
              : state.panels;
            return { syncIndicators: newVal, panels };
          }
          if (type === 'crosshair') {
            return { syncCrosshair: !state.syncCrosshair };
          }
          return {};
        });
      },
      
      setMaximizedPanelId: (id) => {
        set({ maximizedPanelId: id });
      },
      
      swapPanels: (id1, id2) => {
        set((state) => {
          const idx1 = state.panels.findIndex((p) => p.id === id1);
          const idx2 = state.panels.findIndex((p) => p.id === id2);
          if (idx1 === -1 || idx2 === -1) return {};
          
          const panels = [...state.panels];
          const temp = { ...panels[idx1], id: id2 }; // Preserve panel slot IDs, swap content
          panels[idx1] = { ...panels[idx2], id: id1 };
          panels[idx2] = temp;
          
          return { panels };
        });
      },
      
      removePanel: (id) => {
        set((state) => {
          // Revert to single or drop layout panels
          const panels = state.panels.map((p) => 
            p.id === id ? { ...p, type: 'chart' as PanelType, symbol: 'AAPL', timeframe: '1D', indicators: ['Vol', 'EMA9'] } : p
          );
          return { panels, activeWorkspace: 'standard', maximizedPanelId: null };
        });
      },
      
      duplicatePanel: (id) => {
        set((state) => {
          const source = state.panels.find((p) => p.id === id);
          if (!source) return {};
          
          // Duplicate source state to the next available panel slot
          const targetId = state.panels.find((p) => p.id !== id)?.id || 'panel-1';
          const panels = state.panels.map((p) => 
            p.id === targetId ? { ...p, type: source.type, symbol: source.symbol, timeframe: source.timeframe, indicators: [...source.indicators] } : p
          );
          return { panels };
        });
      },
      
      resetLayout: () => {
        set({
          panels: DEFAULT_PANELS,
          activePanelId: 'panel-0',
          activeWorkspace: 'standard',
          syncSymbol: false,
          syncTimeframe: false,
          syncCrosshair: true,
          syncIndicators: false,
          maximizedPanelId: null,
        });
      },
    }),
    {
      name: 'trading-terminal-workspace',
    }
  )
);
