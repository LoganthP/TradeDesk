import apiClient from './client';
import type { Candle, Quote } from '@/lib/types';

export function normalizeMarketSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace('/', '-');
}

export function normalizeTimeframe(timeframe: string): string {
  if (timeframe === '1h') return '1H';
  if (timeframe === '4h') return '4H';
  return timeframe;
}

function normalizeApiTimeframe(timeframe: string): string {
  if (timeframe === '1H') return '1h';
  if (timeframe === '4H') return '4h';
  return timeframe;
}

export async function getCandles(symbol: string, timeframe: string): Promise<Candle[]> {
  const safeSymbol = encodeURIComponent(normalizeMarketSymbol(symbol));
  const safeTimeframe = encodeURIComponent(normalizeApiTimeframe(timeframe));
  const { data } = await apiClient.get<Candle[] | { candles: Candle[] }>(
    `/prices/${safeSymbol}/${safeTimeframe}`,
    { timeout: 3500 },
  );
  return Array.isArray(data) ? data : data.candles;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const safeSymbol = encodeURIComponent(normalizeMarketSymbol(symbol));
  const { data } = await apiClient.get<Quote>(`/prices/${safeSymbol}/quote`, { timeout: 3500 });
  return data;
}
