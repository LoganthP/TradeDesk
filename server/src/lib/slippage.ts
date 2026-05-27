const MAX_SLIPPAGE_PCT = 0.0005; // 0.05%

/**
 * Apply realistic slippage to a fill price.
 * BUY orders fill at a slightly HIGHER price (adverse).
 * SELL orders fill at a slightly LOWER price (adverse).
 *
 * Slippage is random between 0 and MAX_SLIPPAGE_PCT.
 */
export function applySlippage(price: number, side: 'BUY' | 'SELL'): number {
  const slippageFraction = Math.random() * MAX_SLIPPAGE_PCT;

  if (side === 'BUY') {
    return Math.round((price * (1 + slippageFraction)) * 100) / 100;
  }
  // SELL
  return Math.round((price * (1 - slippageFraction)) * 100) / 100;
}
