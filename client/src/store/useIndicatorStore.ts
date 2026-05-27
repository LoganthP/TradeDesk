import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IndicatorSettings {
  period?: number;
  color?: string;
  lineWidth?: number;
  stdDev?: number;
  overbought?: number;
  oversold?: number;
  fillOpacity?: number;
}

export interface IndicatorType {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  hidden?: boolean;
  locked?: boolean;
  settings: IndicatorSettings;
}

interface IndicatorStore {
  indicators: IndicatorType[];
  addIndicator: (indicator: IndicatorType) => void;
  removeIndicator: (id: string) => void;
  toggleIndicator: (id: string) => void;
  setIndicatorVisibility: (id: string, hidden: boolean) => void;
  setIndicatorLock: (id: string, locked: boolean) => void;
  updateIndicatorSettings: (id: string, settings: IndicatorSettings) => void;
  reorderIndicators: (oldIndex: number, newIndex: number) => void;
  isEnabled: (id: string) => boolean;
}

const DEFAULT_INDICATORS: IndicatorType[] = [
  {
    id: 'Vol',
    name: 'Volume',
    category: 'Volume',
    enabled: true,
    settings: { color: 'rgba(38,166,154,0.5)' },
  },
  {
    id: 'EMA9',
    name: 'EMA (9)',
    category: 'Moving Averages',
    enabled: true,
    settings: { period: 9, color: '#FF9800', lineWidth: 1 },
  },
  {
    id: 'EMA21',
    name: 'EMA (21)',
    category: 'Moving Averages',
    enabled: false,
    settings: { period: 21, color: '#E91E63', lineWidth: 1 },
  },
  {
    id: 'EMA50',
    name: 'EMA (50)',
    category: 'Moving Averages',
    enabled: false,
    settings: { period: 50, color: '#2196F3', lineWidth: 1.5 },
  },
  {
    id: 'VWAP',
    name: 'VWAP',
    category: 'Volume',
    enabled: false,
    settings: { color: '#FF6D00', lineWidth: 1.5 },
  },
  {
    id: 'BB',
    name: 'Bollinger Bands',
    category: 'Volatility',
    enabled: false,
    settings: { period: 20, stdDev: 2, color: 'rgba(149,117,205,0.7)', fillOpacity: 0.05 },
  },
];

export const useIndicatorStore = create<IndicatorStore>()(
  persist(
    (set, get) => ({
      indicators: DEFAULT_INDICATORS,

      addIndicator: (indicator) =>
        set((state) => ({
          indicators: state.indicators.some((i) => i.id === indicator.id)
            ? state.indicators
            : [...state.indicators, indicator],
        })),

      removeIndicator: (id) =>
        set((state) => ({
          indicators: state.indicators.filter((i) => i.id !== id),
        })),

      toggleIndicator: (id) =>
        set((state) => ({
          indicators: state.indicators.map((i) =>
            i.id === id ? { ...i, enabled: !i.enabled } : i
          ),
        })),

      updateIndicatorSettings: (id, settings) =>
        set((state) => ({
          indicators: state.indicators.map((i) =>
            i.id === id ? { ...i, settings: { ...i.settings, ...settings } } : i
          ),
        })),

      setIndicatorVisibility: (id, hidden) =>
        set((state) => ({
          indicators: state.indicators.map((i) =>
            i.id === id ? { ...i, hidden } : i
          ),
        })),

      setIndicatorLock: (id, locked) =>
        set((state) => ({
          indicators: state.indicators.map((i) =>
            i.id === id ? { ...i, locked } : i
          ),
        })),

      reorderIndicators: (oldIndex, newIndex) =>
        set((state) => {
          const indicators = [...state.indicators];
          const [moved] = indicators.splice(oldIndex, 1);
          indicators.splice(newIndex, 0, moved);
          return { indicators };
        }),

      isEnabled: (id) => get().indicators.find((i) => i.id === id)?.enabled ?? false,
    }),
    {
      name: 'trading-terminal-indicators',
    }
  )
);
