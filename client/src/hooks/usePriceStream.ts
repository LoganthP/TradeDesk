import { useState, useEffect, useRef, useCallback } from 'react';
import { getQuote, normalizeMarketSymbol } from '@/api/prices';
import type { Quote } from '@/lib/types';

interface PriceStreamResult {
  quote: Quote | null;
  isLoading: boolean;
  error: string | null;
}

export function usePriceStream(symbol: string): PriceStreamResult {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const symbolRef = useRef(normalizeMarketSymbol(symbol));

  const fetchQuote = useCallback(async (sym: string) => {
    try {
      const data = await getQuote(sym);
      if (symbolRef.current === sym) {
        setQuote(data);
        setError(null);
        setIsLoading(false);
      }
    } catch {
      if (symbolRef.current === sym) {
        setError('Failed to fetch quote');
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const normalizedSymbol = normalizeMarketSymbol(symbol);
    symbolRef.current = normalizedSymbol;
    setIsLoading(true);
    setError(null);

    fetchQuote(normalizedSymbol);

    intervalRef.current = setInterval(() => {
      fetchQuote(normalizedSymbol);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, fetchQuote]);

  return { quote, isLoading, error };
}
