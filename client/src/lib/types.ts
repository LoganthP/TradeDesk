export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  startingBalance: number;
  cash: number;
  positions: Position[];
  // enriched by getPortfolio(id)
  totalValue?: number;
  totalUnrealizedPnl?: number;
  totalReturnPercent?: number;
  openOrdersCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  side?: string;
}

export interface Order {
  id: string;
  portfolioId: string;
  symbol: string;
  type: string;
  side: string;
  quantity: number;
  price?: number;
  fillPrice?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Analytics {
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  totalPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  bestTrade: number;
  worstTrade: number;
  equityCurve: EquityPoint[];
}

export interface TradeSummary {
  symbol: string;
  pnl: number;
  percent: number;
}

export interface EquityPoint {
  date: string;
  value: number;
  drawdown?: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  alertAbove?: number;
  alertBelow?: number;
  createdAt: string;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
}

export interface TradeLogEntry {
  date: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  percentReturn: number;
}
