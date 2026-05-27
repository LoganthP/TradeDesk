import prisma from '../lib/prisma.js';
import { getCurrentPrice } from '../lib/priceSimulator.js';
import { calculateUnrealizedPnl, calculatePortfolioValue } from '../lib/pnl.js';
import { AppError } from '../middleware/errorHandler.js';

interface PositionWithPnl {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  side: string;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

interface PortfolioWithPnl {
  id: string;
  name: string;
  cash: number;
  startingBalance: number;
  createdAt: Date;
  positions: PositionWithPnl[];
  totalValue: number;
  totalUnrealizedPnl: number;
  totalReturnPercent: number;
}

/**
 * Get a portfolio with unrealized P&L for each position.
 */
export async function getPortfolioWithPnl(
  portfolioId: string,
): Promise<PortfolioWithPnl> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      positions: true,
    },
  });

  if (!portfolio) {
    throw new AppError(404, 'Portfolio not found');
  }

  // Build current prices map
  const currentPrices: Record<string, number> = {};
  for (const pos of portfolio.positions) {
    try {
      currentPrices[pos.symbol] = getCurrentPrice(pos.symbol);
    } catch {
      // If symbol price can't be fetched, use avg cost
      currentPrices[pos.symbol] = pos.avgCost;
    }
  }

  // Calculate P&L for each position
  const positionsWithPnl: PositionWithPnl[] = portfolio.positions.map((pos) => {
    const currentPrice = currentPrices[pos.symbol] ?? pos.avgCost;
    const unrealizedPnl = calculateUnrealizedPnl(
      pos.avgCost,
      currentPrice,
      pos.quantity,
      pos.side as 'LONG' | 'SHORT',
    );
    const marketValue = currentPrice * pos.quantity;
    const costBasis = pos.avgCost * pos.quantity;
    const unrealizedPnlPercent = costBasis !== 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    return {
      id: pos.id,
      symbol: pos.symbol,
      quantity: pos.quantity,
      avgCost: pos.avgCost,
      side: pos.side,
      currentPrice,
      marketValue: Math.round(marketValue * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      unrealizedPnlPercent: Math.round(unrealizedPnlPercent * 100) / 100,
    };
  });

  const totalValue = calculatePortfolioValue(
    portfolio.cash,
    portfolio.positions,
    currentPrices,
  );

  const totalUnrealizedPnl = positionsWithPnl.reduce(
    (sum, p) => sum + p.unrealizedPnl,
    0,
  );

  const totalReturnPercent =
    portfolio.startingBalance !== 0
      ? ((totalValue - portfolio.startingBalance) / portfolio.startingBalance) * 100
      : 0;

  return {
    id: portfolio.id,
    name: portfolio.name,
    cash: portfolio.cash,
    startingBalance: portfolio.startingBalance,
    createdAt: portfolio.createdAt,
    positions: positionsWithPnl,
    totalValue: Math.round(totalValue * 100) / 100,
    totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
  };
}

/**
 * Reset a portfolio: delete positions, orders, trades, snapshots
 * and reset cash to the new starting balance.
 */
export async function resetPortfolio(
  portfolioId: string,
  startingBalance: number,
): Promise<{ id: string; cash: number; startingBalance: number }> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
  });

  if (!portfolio) {
    throw new AppError(404, 'Portfolio not found');
  }

  await prisma.$transaction([
    prisma.trade.deleteMany({ where: { portfolioId } }),
    prisma.order.deleteMany({ where: { portfolioId } }),
    prisma.position.deleteMany({ where: { portfolioId } }),
    prisma.portfolioSnapshot.deleteMany({ where: { portfolioId } }),
    prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        cash: startingBalance,
        startingBalance,
      },
    }),
  ]);

  return { id: portfolioId, cash: startingBalance, startingBalance };
}
