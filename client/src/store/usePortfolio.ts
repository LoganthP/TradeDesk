import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Portfolio, Order } from '@/lib/types';

interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolioId: string | null;
  orders: Order[];
  
  // Computed (accessed via get().activePortfolio in components or by selecting)
  activePortfolio: Portfolio | null;
  
  setActivePortfolio: (id: string) => void;
  createPortfolio: (name: string, startingBalance: number) => void;
  resetPortfolio: (portfolioId: string, startingBalance: number) => void;
  
  // Trading methods
  placeOrder: (symbol: string, type: string, side: 'BUY' | 'SELL', quantity: number, price: number) => void;
  updatePositionsWithPrices: (prices: Record<string, number>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      portfolios: [],
      activePortfolioId: null,
      activePortfolio: null,
      orders: [],

      setActivePortfolio: (id) => {
        const p = get().portfolios.find(p => p.id === id) || null;
        set({ activePortfolioId: id, activePortfolio: p });
      },

      createPortfolio: (name, startingBalance) => {
        const newPortfolio: Portfolio = {
          id: generateId(),
          userId: 'local-user',
          name,
          startingBalance,
          cash: startingBalance,
          positions: [],
          createdAt: new Date().toISOString()
        };
        const portfolios = [...get().portfolios, newPortfolio];
        set({ 
          portfolios, 
          activePortfolioId: newPortfolio.id,
          activePortfolio: newPortfolio
        });
      },

      resetPortfolio: (portfolioId, startingBalance) => {
        set((state) => {
          const updatedPortfolios = state.portfolios.map(p => {
            if (p.id === portfolioId) {
              return {
                ...p,
                startingBalance,
                cash: startingBalance,
                positions: []
              };
            }
            return p;
          });
          const updatedActive = portfolioId === state.activePortfolioId 
            ? updatedPortfolios.find(p => p.id === portfolioId) || null
            : state.activePortfolio;
            
          return {
            portfolios: updatedPortfolios,
            activePortfolio: updatedActive,
            orders: state.orders.filter(o => o.portfolioId !== portfolioId)
          };
        });
      },

      placeOrder: (symbol, type, side, quantity, price) => {
        set((state) => {
          const p = state.portfolios.find(p => p.id === state.activePortfolioId);
          if (!p) return state;

          const orderCost = quantity * price;
          
          if (side === 'BUY' && p.cash < orderCost) {
            console.error('Insufficient funds');
            return state;
          }

          const newOrder: Order = {
            id: generateId(),
            portfolioId: p.id,
            symbol,
            type,
            side,
            quantity,
            price,
            fillPrice: price,
            status: 'FILLED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const newOrders = [newOrder, ...state.orders];
          
          let newCash = p.cash;
          let newPositions = [...p.positions];
          const existingPosIndex = newPositions.findIndex(pos => pos.symbol === symbol);

          if (side === 'BUY') {
            newCash -= orderCost;
            if (existingPosIndex >= 0) {
              const pos = newPositions[existingPosIndex];
              const totalValue = (pos.quantity * pos.avgCost) + orderCost;
              const newQty = pos.quantity + quantity;
              newPositions[existingPosIndex] = {
                ...pos,
                quantity: newQty,
                avgCost: totalValue / newQty
              };
            } else {
              newPositions.push({
                id: generateId(),
                portfolioId: p.id,
                symbol,
                quantity,
                avgCost: price,
              });
            }
          } else if (side === 'SELL') {
            if (existingPosIndex >= 0) {
              const pos = newPositions[existingPosIndex];
              const sellQty = Math.min(quantity, pos.quantity);
              newCash += sellQty * price;
              
              if (sellQty === pos.quantity) {
                newPositions.splice(existingPosIndex, 1);
              } else {
                newPositions[existingPosIndex] = {
                  ...pos,
                  quantity: pos.quantity - sellQty
                };
              }
            } else {
              // short selling not fully supported in this simple model
              newCash += orderCost;
            }
          }

          const updatedPortfolio = { ...p, cash: newCash, positions: newPositions };
          const updatedPortfolios = state.portfolios.map(port => port.id === p.id ? updatedPortfolio : port);

          return {
            orders: newOrders,
            portfolios: updatedPortfolios,
            activePortfolio: updatedPortfolio
          };
        });
      },

      updatePositionsWithPrices: (prices) => {
        set((state) => {
          if (!state.activePortfolioId) return state;
          const updatedPortfolios = state.portfolios.map(p => {
            if (p.id !== state.activePortfolioId) return p;
            
            let totalPositionValue = 0;
            let totalUnrealized = 0;
            
            const enrichedPositions = p.positions.map(pos => {
              const currentPrice = prices[pos.symbol] || pos.avgCost;
              const marketValue = pos.quantity * currentPrice;
              const costBasis = pos.quantity * pos.avgCost;
              const unrealizedPnl = marketValue - costBasis;
              const unrealizedPnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
              
              totalPositionValue += marketValue;
              totalUnrealized += unrealizedPnl;
              
              return {
                ...pos,
                currentPrice,
                marketValue,
                unrealizedPnl,
                unrealizedPnlPercent
              };
            });
            
            return {
              ...p,
              positions: enrichedPositions,
              totalValue: p.cash + totalPositionValue,
              totalUnrealizedPnl: totalUnrealized,
              totalReturnPercent: ((p.cash + totalPositionValue - p.startingBalance) / p.startingBalance) * 100
            };
          });
          
          return {
            portfolios: updatedPortfolios,
            activePortfolio: updatedPortfolios.find(p => p.id === state.activePortfolioId) || null
          };
        });
      }
    }),
    {
      name: 'tradedesk-portfolio'
    }
  )
);
