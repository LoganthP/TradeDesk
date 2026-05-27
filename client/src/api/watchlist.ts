import apiClient from './client';
import type { WatchlistItem } from '@/lib/types';

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await apiClient.get<{ watchlistId: string; items: WatchlistItem[] }>('/watchlist');
  return data.items ?? data;
}

export async function addToWatchlist(symbol: string): Promise<WatchlistItem> {
  const { data } = await apiClient.post<{ item: WatchlistItem }>('/watchlist', { symbol });
  return data.item ?? data;
}

export async function removeFromWatchlist(id: string): Promise<void> {
  await apiClient.delete(`/watchlist/${id}`);
}

export async function updateWatchlistAlert(
  id: string,
  alertAbove?: number,
  alertBelow?: number,
): Promise<WatchlistItem> {
  const { data } = await apiClient.put<{ item: WatchlistItem }>(`/watchlist/${id}/alert`, {
    alertAbove,
    alertBelow,
  });
  return data.item ?? data;
}
