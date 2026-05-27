/**
 * Calculate unrealized P&L for an open position.
 * LONG: profit when price goes up.  (currentPrice - avgCost) * quantity
 * SHORT: profit when price goes down. (avgCost - currentPrice) * quantity
 */
export function calculateUnrealizedPnl(
  avgCost: number,
  currentPrice: number,
  quantity: number,
  side: 'LONG' | 'SHORT',
): number {
  if (quantity === 0) return 0;
  if (side === 'LONG') {
    return (currentPrice - avgCost) * quantity;
  }
  return (avgCost - currentPrice) * quantity;
}

/**
 * Calculate realized P&L when closing (or partially closing) a position.
 * For a BUY-to-open / SELL-to-close (LONG):
 *   (exitPrice - entryPrice) * quantity
 * For a SELL-to-open / BUY-to-close (SHORT):
 *   (entryPrice - exitPrice) * quantity
 */
export function calculateRealizedPnl(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  side: 'LONG' | 'SHORT',
): number {
  if (quantity === 0) return 0;
  if (side === 'LONG') {
    return (exitPrice - entryPrice) * quantity;
  }
  return (entryPrice - exitPrice) * quantity;
}

/**
 * Calculate the total value of a portfolio.
 * Value = cash + sum(position market value)
 * For LONG positions: currentPrice * quantity
 * For SHORT positions: (2 * avgCost - currentPrice) * quantity
 *   (initial margin locked + unrealized P&L)
 */
export function calculatePortfolioValue(
  cash: number,
  positions: Array<{
    symbol: string;
    quantity: number;
    avgCost: number;
    side: string;
  }>,
  currentPrices: Record<string, number>,
): number {
  let positionValue = 0;

  for (const pos of positions) {
    const price = currentPrices[pos.symbol];
    if (price === undefined) continue;

    if (pos.side === 'LONG') {
      positionValue += price * pos.quantity;
    } else {
      // SHORT: the locked collateral was avgCost * quantity, plus unrealized P&L
      positionValue += (2 * pos.avgCost - price) * pos.quantity;
    }
  }

  return cash + positionValue;
}
