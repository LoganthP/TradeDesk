import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistItem } from '@/lib/types';
import { useToast } from '@/store/useToast';

interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addSymbol: (symbol: string) => Promise<void>;
  removeSymbol: (id: string) => Promise<void>;
  updateAlert: (id: string, alertAbove?: number, alertBelow?: number) => Promise<void>;
}

// Mock initial symbols for realistic data out of the box
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: DEFAULT_SYMBOLS.map((sym, i) => ({
        id: `local-${i}`,
        symbol: sym,
        createdAt: new Date().toISOString()
      })),
      isLoading: false,

      refresh: async () => {
        // Since we are pure local storage now per user request, we just let persist handle it.
        // We could fetch live prices here but usePriceStream handles that at the component level.
        set({ isLoading: false });
      },

      addSymbol: async (symbol: string) => {
        const { items } = get();
        if (items.some(i => i.symbol === symbol)) {
          useToast.getState().addToast({ title: 'Already added', message: `${symbol} is already in your watchlist`, type: 'error' });
          return;
        }

        const newItem: WatchlistItem = {
          id: `local-${Date.now()}`,
          symbol,
          createdAt: new Date().toISOString()
        };

        set({ items: [...items, newItem] });
        useToast.getState().addToast({ title: 'Added to Watchlist', message: `Added ${symbol} to watchlist`, type: 'success' });
      },

      removeSymbol: async (id: string) => {
        const { items } = get();
        const item = items.find(i => i.id === id);
        set({ items: items.filter((i) => i.id !== id) });
        if (item) {
          useToast.getState().addToast({ title: 'Removed', message: `Removed ${item.symbol}`, type: 'success' });
        }
      },

      updateAlert: async (id, alertAbove, alertBelow) => {
        set((state) => ({
          items: state.items.map((i) => 
            i.id === id ? { ...i, alertAbove, alertBelow } : i
          ),
        }));
        useToast.getState().addToast({ title: 'Alert Updated', message: 'Alert updated successfully', type: 'success' });
      },
    }),
    {
      name: 'trading-watchlist',
    }
  )
);
