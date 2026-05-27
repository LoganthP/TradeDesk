import apiClient from './client';
import type { Analytics } from '@/lib/types';

export async function getAnalytics(portfolioId: string): Promise<Analytics> {
  const { data } = await apiClient.get<{ analytics: Analytics }>(`/analytics/${portfolioId}`);
  return data.analytics ?? data;
}
