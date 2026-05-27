import { useChart } from '@/store/useChart';
import { usePriceStream } from '@/hooks/usePriceStream';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { ALL_SYMBOLS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function PriceTicker() {
  const symbol = useChart((s) => s.symbol);
  const { quote, isLoading } = usePriceStream(symbol);

  const symbolInfo = ALL_SYMBOLS.find((s) => s.symbol === symbol);

  const changeColor = getChangeColor(quote?.change ?? 0);
  const isUp = (quote?.change ?? 0) > 0;
  const isDown = (quote?.change ?? 0) < 0;

  return (
    <div className="flex items-center gap-4 min-w-0">
      {/* Symbol & Name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-text-primary font-mono">{symbol}</h2>
          {symbolInfo && (
            <span className="hidden sm:block text-xs text-text-muted truncate max-w-[140px]">
              {symbolInfo.name}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      {isLoading ? (
        <div className="h-6 w-24 skeleton rounded" />
      ) : quote ? (
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono text-text-primary tabular-nums">
            {formatCurrency(quote.price)}
          </span>
          <div className={cn('flex items-center gap-1', changeColor)}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            <span className="text-sm font-semibold font-mono tabular-nums">
              {formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
