import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  chartBackground: 'solid' | 'gradient';
  candleColors: 'default' | 'monochrome' | 'neon';
  gridLines: boolean;
  crosshairStyle: 'dashed' | 'solid' | 'dotted';
  defaultOrderType: 'market' | 'limit';
  confirmOrders: boolean;
  
  updateSetting: <K extends keyof Omit<SettingsState, 'updateSetting'>>(key: K, value: SettingsState[K]) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 'medium',
      chartBackground: 'solid',
      candleColors: 'default',
      gridLines: true,
      crosshairStyle: 'dashed',
      defaultOrderType: 'market',
      confirmOrders: true,
      
      updateSetting: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'tradedesk-settings',
    }
  )
);
