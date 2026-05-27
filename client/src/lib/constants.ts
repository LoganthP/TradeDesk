export interface SymbolInfo {
  symbol: string;
  name: string;
  basePrice: number;
}

export const EQUITY_SYMBOLS: SymbolInfo[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 185.5 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 378.9 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 141.2 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 178.3 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 875.4 },
  { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 485.6 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 245.8 },
  { symbol: 'JPM', name: 'JPMorgan Chase', basePrice: 195.2 },
  { symbol: 'V', name: 'Visa Inc.', basePrice: 275.4 },
  { symbol: 'WMT', name: 'Walmart Inc.', basePrice: 162.3 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', basePrice: 156.8 },
  { symbol: 'MA', name: 'Mastercard Inc.', basePrice: 458.7 },
  { symbol: 'PG', name: 'Procter & Gamble', basePrice: 158.4 },
  { symbol: 'UNH', name: 'UnitedHealth Group', basePrice: 528.3 },
  { symbol: 'HD', name: 'Home Depot Inc.', basePrice: 345.6 },
  { symbol: 'DIS', name: 'Walt Disney Co.', basePrice: 112.4 },
  { symbol: 'BAC', name: 'Bank of America', basePrice: 34.5 },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', basePrice: 105.8 },
  { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 485.2 },
  { symbol: 'AMD', name: 'AMD Inc.', basePrice: 178.9 },
];

export const CRYPTO_SYMBOLS: SymbolInfo[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', basePrice: 64250.0 },
  { symbol: 'ETH-USD', name: 'Ethereum', basePrice: 3420.5 },
  { symbol: 'SOL-USD', name: 'Solana', basePrice: 142.8 },
  { symbol: 'BNB-USD', name: 'BNB', basePrice: 585.3 },
  { symbol: 'ADA-USD', name: 'Cardano', basePrice: 0.62 },
  { symbol: 'DOGE-USD', name: 'Dogecoin', basePrice: 0.165 },
  { symbol: 'XRP-USD', name: 'Ripple', basePrice: 0.58 },
  { symbol: 'DOT-USD', name: 'Polkadot', basePrice: 7.85 },
  { symbol: 'AVAX-USD', name: 'Avalanche', basePrice: 38.4 },
  { symbol: 'LINK-USD', name: 'Chainlink', basePrice: 18.5 },
];

export const ALL_SYMBOLS: SymbolInfo[] = [...EQUITY_SYMBOLS, ...CRYPTO_SYMBOLS];

export interface Timeframe {
  value: string;
  label: string;
}

export const TIMEFRAMES: Timeframe[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1H', label: '1H' },
  { value: '4H', label: '4H' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
];

export const ORDER_TYPES = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  STOP_LOSS: 'STOP_LOSS',
  TAKE_PROFIT: 'TAKE_PROFIT',
} as const;

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];

export const ORDER_SIDES = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

export type OrderSide = (typeof ORDER_SIDES)[keyof typeof ORDER_SIDES];

export const ORDER_STATUSES = {
  OPEN: 'OPEN',
  FILLED: 'FILLED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const STARTING_BALANCES = [1_000, 10_000, 50_000, 100_000, 500_000, 1_000_000];
