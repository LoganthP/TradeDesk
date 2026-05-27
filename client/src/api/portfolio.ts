import apiClient from './client';
import type { Portfolio } from '@/lib/types';

export async function getPortfolios(): Promise<Portfolio[]> {
  const { data } = await apiClient.get<{ portfolios: Portfolio[] }>('/portfolio');
  return data.portfolios ?? data;
}

export async function getPortfolio(id: string): Promise<Portfolio> {
  const { data } = await apiClient.get<{ portfolio: Portfolio }>(`/portfolio/${id}`);
  return data.portfolio ?? data;
}

export async function createPortfolio(name: string, startingBalance: number): Promise<Portfolio> {
  const { data } = await apiClient.post<{ portfolio: Portfolio }>('/portfolio', { name, startingBalance });
  return data.portfolio ?? data;
}

export async function resetPortfolio(portfolioId: string, startingBalance: number): Promise<Portfolio> {
  const { data } = await apiClient.post<{ portfolio: Portfolio }>('/portfolio/reset', { portfolioId, startingBalance });
  return data.portfolio ?? data;
}
