import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface TradeRecord {
  realizedPnl: number;
  fillPrice: number;
  fillQty: number;
  side: string;
  createdAt: Date;
}

interface AnalyticsResult {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  bestTrade: number;
  worstTrade: number;
  equityCurve: Array<{ date: string; value: number }>;
}

/**
 * Compute analytics for a portfolio from its trade history.
 */
export async function getAnalytics(
  portfolioId: string,
): Promise<AnalyticsResult> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
  });

  if (!portfolio) {
    throw new AppError(404, 'Portfolio not found');
  }

  const trades = await prisma.trade.findMany({
    where: { portfolioId },
    orderBy: { createdAt: 'asc' },
  });

  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      totalPnl: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      bestTrade: 0,
      worstTrade: 0,
      equityCurve: [
        {
          date: portfolio.createdAt.toISOString().split('T')[0],
          value: portfolio.startingBalance,
        },
      ],
    };
  }

  // Only SELL trades realize P&L
  const sellTrades = trades.filter(
    (t: TradeRecord) => t.side === 'SELL' && t.realizedPnl !== 0,
  );

  const wins = sellTrades.filter((t: TradeRecord) => t.realizedPnl > 0);
  const losses = sellTrades.filter((t: TradeRecord) => t.realizedPnl < 0);

  const totalTrades = sellTrades.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

  const totalWins = wins.reduce((sum: number, t: TradeRecord) => sum + t.realizedPnl, 0);
  const totalLosses = Math.abs(
    losses.reduce((sum: number, t: TradeRecord) => sum + t.realizedPnl, 0),
  );

  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;

  const totalPnl = sellTrades.reduce(
    (sum: number, t: TradeRecord) => sum + t.realizedPnl,
    0,
  );

  // Find best and worst trades
  const pnlValues = sellTrades.map((t: TradeRecord) => t.realizedPnl);
  const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

  // ── Equity curve & drawdown ───────────────────────────────────────
  const equityCurve: Array<{ date: string; value: number }> = [];
  let cumulativeValue = portfolio.startingBalance;
  let peak = cumulativeValue;
  let maxDrawdown = 0;
  const dailyReturns: number[] = [];
  let previousValue = cumulativeValue;

  // Group trades by date
  const tradesByDate = new Map<string, number>();
  for (const trade of trades) {
    const date = trade.createdAt.toISOString().split('T')[0];
    const existing = tradesByDate.get(date) ?? 0;
    tradesByDate.set(date, existing + trade.realizedPnl);
  }

  equityCurve.push({
    date: portfolio.createdAt.toISOString().split('T')[0],
    value: Math.round(cumulativeValue * 100) / 100,
  });

  for (const [date, dayPnl] of tradesByDate) {
    cumulativeValue += dayPnl;

    // Daily return for Sharpe
    const dailyReturn = previousValue !== 0 ? (cumulativeValue - previousValue) / previousValue : 0;
    dailyReturns.push(dailyReturn);
    previousValue = cumulativeValue;

    // Track peak and drawdown
    if (cumulativeValue > peak) {
      peak = cumulativeValue;
    }
    const drawdown = peak > 0 ? ((peak - cumulativeValue) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    equityCurve.push({
      date,
      value: Math.round(cumulativeValue * 100) / 100,
    });
  }

  // ── Simplified Sharpe Ratio ───────────────────────────────────────
  // Annualized: (mean return / std dev) * sqrt(252)
  let sharpeRatio = 0;
  if (dailyReturns.length > 1) {
    const meanReturn =
      dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce(
        (sum, r) => sum + Math.pow(r - meanReturn, 2),
        0,
      ) /
      (dailyReturns.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = (meanReturn / stdDev) * Math.sqrt(252);
    }
  }

  return {
    totalTrades,
    winRate: Math.round(winRate * 100) / 100,
    profitFactor:
      profitFactor === Infinity
        ? 999
        : Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
    equityCurve,
  };
}
