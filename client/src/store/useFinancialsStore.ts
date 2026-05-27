import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FinancialTab = 'income' | 'balance' | 'cashflow';
export type FinancialPeriod = 'annual' | 'quarterly';

export interface FinancialsStore {
  activeTab: FinancialTab;
  activePeriod: FinancialPeriod;
  searchQuery: string;

  setTab: (tab: FinancialTab) => void;
  setPeriod: (period: FinancialPeriod) => void;
  setSearch: (query: string) => void;
}

export const useFinancialsStore = create<FinancialsStore>()(
  persist(
    (set) => ({
      activeTab: 'income',
      activePeriod: 'annual',
      searchQuery: '',

      setTab: (tab) => set({ activeTab: tab }),
      setPeriod: (period) => set({ activePeriod: period }),
      setSearch: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'financials-storage',
    }
  )
);
