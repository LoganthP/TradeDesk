import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Holding = {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
};

export type Trade = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: number;
};

export type Portfolio = {
  id: string;
  name: string;
  balance: number;
  startingBalance: number;
  holdings: Holding[];
  trades: Trade[];
  createdAt: number;
  updatedAt: number;
};

export interface PortfolioStore {
  portfolios: Portfolio[];
  activePortfolioId: string | null;

  activePortfolio: Portfolio | null;

  createPortfolio: (name: string, startingBalance: number) => Portfolio;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;
  setActivePortfolio: (id: string | null) => void;
  resetPortfolio: (id: string, startingBalance?: number) => void;

  // Trading actions
  placeOrder: (symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number) => void;
  updateMarketPrices: (prices: Record<string, number>) => void;
}

const DEFAULT_STARTING_BALANCE = 100_000;

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const createDefaultPortfolio = (): Portfolio => {
  const now = Date.now();

  return {
    id: generateId(),
    name: 'Default Portfolio',
    balance: DEFAULT_STARTING_BALANCE,
    startingBalance: DEFAULT_STARTING_BALANCE,
    holdings: [],
    trades: [],
    createdAt: now,
    updatedAt: now,
  };
};

const normalizePortfolio = (portfolio: Portfolio): Portfolio => ({
  ...portfolio,
  balance: Number.isFinite(portfolio.balance) ? portfolio.balance : portfolio.startingBalance,
  startingBalance: Number.isFinite(portfolio.startingBalance)
    ? portfolio.startingBalance
    : DEFAULT_STARTING_BALANCE,
  holdings: Array.isArray(portfolio.holdings) ? portfolio.holdings : [],
  trades: Array.isArray(portfolio.trades) ? portfolio.trades : [],
  createdAt: portfolio.createdAt || Date.now(),
  updatedAt: portfolio.updatedAt || portfolio.createdAt || Date.now(),
});

const resolveActivePortfolio = (portfolios: Portfolio[], activePortfolioId: string | null) =>
  portfolios.find((portfolio) => portfolio.id === activePortfolioId) ?? portfolios[0] ?? null;

const initialPortfolio = createDefaultPortfolio();

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      portfolios: [initialPortfolio],
      activePortfolioId: initialPortfolio.id,
      activePortfolio: initialPortfolio,

      createPortfolio: (name, startingBalance) => {
        const trimmedName = name.trim();
        const safeStartingBalance = Number.isFinite(startingBalance) && startingBalance > 0
          ? startingBalance
          : DEFAULT_STARTING_BALANCE;
        const now = Date.now();
        const newPortfolio: Portfolio = {
          id: generateId(),
          name: trimmedName,
          balance: safeStartingBalance,
          startingBalance: safeStartingBalance,
          holdings: [],
          trades: [],
          createdAt: now,
          updatedAt: now,
        };

        const portfolios = [...get().portfolios, newPortfolio];
        set({
          portfolios,
          activePortfolioId: newPortfolio.id,
          activePortfolio: newPortfolio,
        });

        return newPortfolio;
      },

      updatePortfolio: (id, updates) => {
        set((state) => {
          const portfolios = state.portfolios.map((p) =>
            p.id === id
              ? normalizePortfolio({
                  ...p,
                  ...updates,
                  name: updates.name !== undefined ? updates.name.trim() : p.name,
                  updatedAt: Date.now(),
                })
              : p
          );
          const activePortfolio = portfolios.find((p) => p.id === state.activePortfolioId) || null;
          return { portfolios, activePortfolio };
        });
      },

      deletePortfolio: (id) => {
        set((state) => {
          const portfolios = state.portfolios.filter((p) => p.id !== id);
          let newActiveId = state.activePortfolioId;
          if (state.activePortfolioId === id) {
            newActiveId = portfolios.length > 0 ? portfolios[0].id : null;
          }
          const activePortfolio = portfolios.find((p) => p.id === newActiveId) || null;
          return { portfolios, activePortfolioId: newActiveId, activePortfolio };
        });
      },

      setActivePortfolio: (id) => {
        set((state) => {
          const activePortfolio = state.portfolios.find((p) => p.id === id) || null;
          return { activePortfolioId: activePortfolio?.id ?? null, activePortfolio };
        });
      },

      resetPortfolio: (id, startingBalance) => {
        set((state) => {
          const portfolios = state.portfolios.map((p) => {
            if (p.id === id) {
              const newBalance = startingBalance !== undefined ? startingBalance : p.startingBalance;
              return {
                ...p,
                balance: newBalance,
                startingBalance: newBalance,
                holdings: [],
                trades: [],
                updatedAt: Date.now(),
              };
            }
            return p;
          });
          const activePortfolio = portfolios.find((p) => p.id === state.activePortfolioId) || null;
          return { portfolios, activePortfolio };
        });
      },

      placeOrder: (symbol, side, quantity, price) => {
        set((state) => {
          const p = state.portfolios.find((p) => p.id === state.activePortfolioId);
          if (!p) return state;

          const orderValue = quantity * price;

          if (side === 'BUY' && p.balance < orderValue) {
            console.error('Insufficient funds');
            return state; // Ideally handled via UI before reaching here
          }

          const newTrade: Trade = {
            id: generateId(),
            symbol,
            side,
            quantity,
            price,
            timestamp: Date.now(),
          };

          let newBalance = p.balance;
          const newHoldings = [...p.holdings];
          const existingHoldingIndex = newHoldings.findIndex((h) => h.symbol === symbol);

          if (side === 'BUY') {
            newBalance -= orderValue;
            if (existingHoldingIndex >= 0) {
              const h = newHoldings[existingHoldingIndex];
              const totalCost = (h.quantity * h.averagePrice) + orderValue;
              const newQty = h.quantity + quantity;
              newHoldings[existingHoldingIndex] = {
                ...h,
                quantity: newQty,
                averagePrice: totalCost / newQty,
              };
            } else {
              newHoldings.push({
                symbol,
                quantity,
                averagePrice: price,
                currentPrice: price,
                unrealizedPnL: 0,
              });
            }
          } else if (side === 'SELL') {
            if (existingHoldingIndex >= 0) {
              const h = newHoldings[existingHoldingIndex];
              const sellQty = Math.min(quantity, h.quantity);
              newBalance += sellQty * price;

              if (sellQty === h.quantity) {
                newHoldings.splice(existingHoldingIndex, 1);
              } else {
                newHoldings[existingHoldingIndex] = {
                  ...h,
                  quantity: h.quantity - sellQty,
                };
              }
            } else {
              // Not handling short selling in this basic model, but credit balance
              newBalance += orderValue;
            }
          }

          const updatedPortfolio: Portfolio = {
            ...p,
            balance: newBalance,
            holdings: newHoldings,
            trades: [newTrade, ...p.trades],
            updatedAt: Date.now(),
          };

          const portfolios = state.portfolios.map((port) => (port.id === p.id ? updatedPortfolio : port));

          return {
            portfolios,
            activePortfolio: updatedPortfolio,
          };
        });
      },

      updateMarketPrices: (prices) => {
        set((state) => {
          if (!state.activePortfolioId) return state;
          
          const portfolios = state.portfolios.map((p) => {
            if (p.id !== state.activePortfolioId) return p;

            let updatedHoldings = false;
            const newHoldings = p.holdings.map((h) => {
              const currentPrice = prices[h.symbol];
              if (currentPrice !== undefined && currentPrice !== h.currentPrice) {
                updatedHoldings = true;
                const costBasis = h.quantity * h.averagePrice;
                const marketValue = h.quantity * currentPrice;
                return {
                  ...h,
                  currentPrice,
                  unrealizedPnL: marketValue - costBasis,
                };
              }
              return h;
            });

            if (!updatedHoldings) return p;

            return {
              ...p,
              holdings: newHoldings,
              updatedAt: Date.now(),
            };
          });

          const activePortfolio = portfolios.find((p) => p.id === state.activePortfolioId) || null;
          return { portfolios, activePortfolio };
        });
      },
    }),
    {
      name: 'tradeDesk-portfolios',
      partialize: (state) => ({
        portfolios: state.portfolios,
        activePortfolioId: state.activePortfolioId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const portfolios = state.portfolios.length > 0
          ? state.portfolios.map(normalizePortfolio)
          : [createDefaultPortfolio()];
        const activePortfolio = resolveActivePortfolio(portfolios, state.activePortfolioId);

        usePortfolioStore.setState({
          portfolios,
          activePortfolioId: activePortfolio?.id ?? null,
          activePortfolio,
        });
      },
    }
  )
);
