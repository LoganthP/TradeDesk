import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CursorData {
  time?: number | string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  vwap?: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  bbUpper?: number;
  bbMid?: number;
  bbLower?: number;
}

export interface DrawingObject {
  id: string;
  type: string;
  visible?: boolean;
  hidden?: boolean;
  locked?: boolean;
  [key: string]: unknown;
}

interface ChartState {
  symbol: string;
  activeTimeframe: string;
  activeRange: string;
  isExtended: boolean;
  isLogScale: boolean;
  isPercentMode: boolean;
  isAutoScale: boolean;
  layoutGrid: number;
  activeDrawingTool: string | null;
  cursorData: CursorData | null;
  drawingObjects: DrawingObject[];

  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  setRange: (range: string) => void;
  toggleExtended: () => void;
  toggleLogScale: () => void;
  togglePercentMode: () => void;
  toggleAutoScale: () => void;
  setLayoutGrid: (grid: number) => void;
  setActiveDrawingTool: (tool: string | null) => void;
  setCursorData: (data: CursorData | null) => void;
  setDrawingObjects: (objects: DrawingObject[]) => void;
  updateDrawingObject: (id: string, partial: Partial<DrawingObject>) => void;
  removeDrawingObject: (id: string) => void;
  reorderDrawingObjects: (oldIndex: number, newIndex: number) => void;
}

export const useChart = create<ChartState>()(
  persist(
    (set) => ({
      symbol: 'AAPL',
      activeTimeframe: '1D',
      activeRange: '1D',
      isExtended: false,
      isLogScale: false,
      isPercentMode: false,
      isAutoScale: true,
      layoutGrid: 1,
      activeDrawingTool: null,
      cursorData: null,
      drawingObjects: [],

      setSymbol: (symbol) => set({ symbol }),
      setTimeframe: (activeTimeframe) => set({ activeTimeframe }),
      setRange: (activeRange) => set({ activeRange }),
      toggleExtended: () => set((state) => ({ isExtended: !state.isExtended })),
      toggleLogScale: () => set((state) => ({ isLogScale: !state.isLogScale })),
      togglePercentMode: () => set((state) => ({ isPercentMode: !state.isPercentMode })),
      toggleAutoScale: () => set((state) => ({ isAutoScale: !state.isAutoScale })),
      setLayoutGrid: (layoutGrid) => set({ layoutGrid }),
      setActiveDrawingTool: (activeDrawingTool) => set({ activeDrawingTool }),
      setCursorData: (cursorData) => set({ cursorData }),
      setDrawingObjects: (drawingObjects) => set({ drawingObjects }),
      updateDrawingObject: (id, partial) =>
        set((state) => ({
          drawingObjects: state.drawingObjects.map((d) =>
            d.id === id ? { ...d, ...partial } : d
          ),
        })),
      removeDrawingObject: (id) =>
        set((state) => ({
          drawingObjects: state.drawingObjects.filter((d) => d.id !== id),
        })),
      reorderDrawingObjects: (oldIndex, newIndex) =>
        set((state) => {
          const drawingObjects = [...state.drawingObjects];
          const [moved] = drawingObjects.splice(oldIndex, 1);
          drawingObjects.splice(newIndex, 0, moved);
          return { drawingObjects };
        }),
    }),
    {
      name: 'tradedesk-chart',
      partialize: (state) => ({
        symbol: state.symbol,
        activeTimeframe: state.activeTimeframe,
        activeRange: state.activeRange,
        isExtended: state.isExtended,
        isLogScale: state.isLogScale,
        isPercentMode: state.isPercentMode,
        isAutoScale: state.isAutoScale,
        layoutGrid: state.layoutGrid,
        drawingObjects: state.drawingObjects,
      }),
    }
  )
);
