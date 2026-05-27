import { useEffect, useRef } from 'react';
import { usePortfolio } from '@/store/usePortfolio';
import { usePriceStream } from './usePriceStream';
import { useChart } from '@/store/useChart';

export function useOrderFills(): void {
  const { orders } = usePortfolio();
  const symbol = useChart((s) => s.symbol);
  const { quote } = usePriceStream(symbol);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!quote || processingRef.current) return;

    const openOrders = orders.filter(
      (o) => o.status === 'OPEN' && o.symbol === quote.symbol,
    );

    if (openOrders.length === 0) return;

    let shouldRefresh = false;

    for (const order of openOrders) {
      const price = quote.price;
      const orderPrice = order.price ?? 0;

      if (order.type === 'LIMIT') {
        if (order.side === 'BUY' && price <= orderPrice) shouldRefresh = true;
        if (order.side === 'SELL' && price >= orderPrice) shouldRefresh = true;
      } else if (order.type === 'STOP_LOSS') {
        if (order.side === 'SELL' && price <= orderPrice) shouldRefresh = true;
        if (order.side === 'BUY' && price >= orderPrice) shouldRefresh = true;
      } else if (order.type === 'TAKE_PROFIT') {
        if (order.side === 'SELL' && price >= orderPrice) shouldRefresh = true;
        if (order.side === 'BUY' && price <= orderPrice) shouldRefresh = true;
      }
    }

    if (shouldRefresh) {
      processingRef.current = true;
      // no-op, handled by global store
      processingRef.current = false;
    }
  }, [quote, orders]);
}
