import { useEffect } from 'react';
import { usePortfolioStore } from '@/store/usePortfolioStore';

export function useMockMarket() {
  const activePortfolioId = usePortfolioStore((state) => state.activePortfolioId);

  useEffect(() => {
    if (!activePortfolioId) return;

    const interval = setInterval(() => {
      const state = usePortfolioStore.getState();
      const portfolio = state.activePortfolio;
      
      if (!portfolio || portfolio.holdings.length === 0) return;

      const newPrices: Record<string, number> = {};
      
      portfolio.holdings.forEach((holding) => {
        // Random walk: max 0.2% change per tick
        const changePercent = (Math.random() - 0.5) * 2 * 0.002;
        const newPrice = holding.currentPrice * (1 + changePercent);
        newPrices[holding.symbol] = Number(newPrice.toFixed(2));
      });

      state.updateMarketPrices(newPrices);
    }, 1500);

    return () => clearInterval(interval);
  }, [activePortfolioId]);
}
