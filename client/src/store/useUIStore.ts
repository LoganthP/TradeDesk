import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  rightPanelActive: string | null;
  toggleRightPanel: (panel: string) => void;
  closeRightPanel: () => void;
  activeModal: string | null;
  openModal: (modal: string) => void;
  closeModal: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      rightPanelActive: 'watchlist', // Default to watchlist open
      toggleRightPanel: (panel) => set((state) => ({ 
        rightPanelActive: state.rightPanelActive === panel ? null : panel 
      })),
      closeRightPanel: () => set({ rightPanelActive: null }),
      activeModal: null,
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
