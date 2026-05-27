export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── Base prices for supported symbols ──────────────────────────────
const BASE_PRICES: Record<string, number> = {
  AAPL: 175,
  GOOGL: 140,
  MSFT: 380,
  AMZN: 185,
  TSLA: 245,
  META: 505,
  NVDA: 875,
  JPM: 195,
  V: 280,
  WMT: 165,
  'BTC-USD': 45000,
  'ETH-USD': 2500,
  'SOL-USD': 110,
  'DOGE-USD': 0.085,
  'XRP-USD': 0.55,
};

// Timeframe durations in milliseconds
const TIMEFRAME_MS: Record<string, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1D': 86_400_000,
  '1W': 604_800_000,
};

export const SUPPORTED_SYMBOLS = Object.keys(BASE_PRICES);
export const SUPPORTED_TIMEFRAMES = Object.keys(TIMEFRAME_MS);

// ── Deterministic seeded PRNG (mulberry32) ─────────────────────────
function hashSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const ch = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Candle generation ──────────────────────────────────────────────
export function generateCandles(
  symbol: string,
  timeframe: string,
  count: number,
): Candle[] {
  const basePrice = BASE_PRICES[symbol];
  if (basePrice === undefined) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }
  if (!TIMEFRAME_MS[timeframe]) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  const seed = hashSymbol(symbol) + hashSymbol(timeframe);
  const rand = mulberry32(seed);

  const intervalMs = TIMEFRAME_MS[timeframe];
  const now = Date.now();
  const startTime = now - count * intervalMs;

  // Volatility scales with timeframe length
  const volatilityBase = basePrice * 0.002; // 0.2% of price per 1-min candle
  const timeMultiplier = Math.sqrt(intervalMs / 60_000); // scale by sqrt of period ratio
  const volatility = volatilityBase * timeMultiplier;

  // Mean-reversion strength
  const meanReversionStrength = 0.01;

  const candles: Candle[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * intervalMs;

    // Random walk with mean reversion
    const meanReversionForce = (basePrice - currentPrice) * meanReversionStrength;
    const randomShock = (rand() - 0.5) * 2 * volatility;
    const priceChange = meanReversionForce + randomShock;

    const open = Math.max(currentPrice, 0.01);
    currentPrice = Math.max(currentPrice + priceChange, 0.01);
    const close = currentPrice;

    // Generate intra-candle high and low
    const intraVolatility = volatility * 0.5;
    const high = Math.max(open, close) + rand() * intraVolatility;
    const low = Math.max(Math.min(open, close) - rand() * intraVolatility, 0.001);

    // Volume: random with a base proportional to price
    const baseVolume = basePrice > 1000 ? 5000 : basePrice > 100 ? 50000 : 500000;
    const volume = Math.round(baseVolume * (0.5 + rand() * 1.5) * timeMultiplier);

    candles.push({
      time: Math.floor(time / 1000), // Unix seconds
      open: roundPrice(open, basePrice),
      high: roundPrice(high, basePrice),
      low: roundPrice(low, basePrice),
      close: roundPrice(close, basePrice),
      volume,
    });
  }

  return candles;
}

/**
 * Get the "current" price for a symbol.
 * Uses deterministic generation so the same symbol always yields a
 * consistent price within the same minute.
 */
export function getCurrentPrice(symbol: string): number {
  const basePrice = BASE_PRICES[symbol];
  if (basePrice === undefined) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  // Generate a small set of 1-minute candles ending now and return the last close
  const candles = generateCandles(symbol, '1m', 60);
  return candles[candles.length - 1].close;
}

// ── Helpers ────────────────────────────────────────────────────────
function roundPrice(price: number, basePrice: number): number {
  if (basePrice < 1) {
    // Micro-cap / meme coins — 6 decimals
    return Math.round(price * 1_000_000) / 1_000_000;
  }
  if (basePrice < 10) {
    return Math.round(price * 10_000) / 10_000;
  }
  return Math.round(price * 100) / 100;
}
