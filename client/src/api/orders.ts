import apiClient from './client';
import type { Order, PaginatedOrders } from '@/lib/types';

interface PlaceOrderParams {
  portfolioId: string;
  symbol: string;
  type: string;
  side: string;
  quantity: number;
  price?: number;
}

export async function placeOrder(params: PlaceOrderParams): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', params);
  return data;
}

interface GetOrdersParams {
  portfolioId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getOrders(params: GetOrdersParams = {}): Promise<PaginatedOrders> {
  const { data } = await apiClient.get<PaginatedOrders>('/orders', { params });
  return data;
}

export async function cancelOrder(orderId: string): Promise<void> {
  await apiClient.delete(`/orders/${orderId}`);
}
