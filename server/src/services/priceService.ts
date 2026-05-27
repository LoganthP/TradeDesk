import {
  generateCandles,
  getCurrentPrice,
  SUPPORTED_SYMBOLS,
  type Candle,
} from '../lib/priceSimulator.js';

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

/**
 * Get OHLCV candle data for a symbol and timeframe.
 */
export function getCandles(
  symbol: string,
  timeframe: string,
  count: number = 200,
): Candle[] {
  return generateCandles(symbol, timeframe, count);
}

/**
 * Get a single quote for a symbol.
 */
export function getQuote(symbol: string): Quote {
  const price = getCurrentPrice(symbol);

  // Get two 1D candles to calculate daily change
  const dailyCandles = generateCandles(symbol, '1D', 2);
  const previousClose = dailyCandles[0].close;
  const change = price - previousClose;
  const changePercent =
    previousClose !== 0 ? (change / previousClose) * 100 : 0;

  // Get recent volume from the latest 1h candle
  const hourCandles = generateCandles(symbol, '1h', 1);
  const volume = hourCandles[0].volume;

  return {
    symbol,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume,
  };
}

/**
 * Get quotes for multiple symbols at once.
 */
export function getAllQuotes(symbols?: string[]): Quote[] {
  const targetSymbols = symbols ?? SUPPORTED_SYMBOLS;
  return targetSymbols.map((symbol) => getQuote(symbol));
}
