import { useChart } from '@/store/useChart';
import { usePriceStream } from '@/hooks/usePriceStream';
import { formatCurrency, formatPercent, getChangeColor, cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Mock data
const STATS = [
  { label: 'Market Cap', value: '2.4T' },
  { label: 'P/E Ratio', value: '28.4' },
  { label: 'Div Yield', value: '1.2%' },
];

export function SymbolDetail() {
  const { symbol } = useChart();
  const { quote } = usePriceStream(symbol);
  
  const [dayRange, setDayRange] = useState({ low: 0, high: 0 });

  useEffect(() => {
    if (quote) {
      setDayRange(prev => ({
        low: prev.low === 0 ? quote.price * 0.98 : Math.min(prev.low, quote.price),
        high: prev.high === 0 ? quote.price * 1.02 : Math.max(prev.high, quote.price),
      }));
    }
  }, [quote]);

  const changeColor = getChangeColor(quote?.change ?? 0);

  return (
    <div className="flex flex-col border-t border-border-primary bg-bg-base flex-shrink-0">
      <div className="p-3 border-b border-border-primary">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-text-primary">{symbol}</span>
          {quote && (
            <span className={cn('font-mono-numbers font-bold text-[13px]', changeColor)}>
              {formatCurrency(quote.price)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>Technology</span>
          {quote && (
            <span className={changeColor}>
              {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({formatPercent(quote.changePercent)})
            </span>
          )}
        </div>
      </div>

      <div className="p-3 border-b border-border-primary">
        <span className="section-head mb-2 block">Day's Range</span>
        <div className="flex items-center gap-2 text-[11px] font-mono-numbers text-text-muted">
          <span>{formatCurrency(dayRange.low)}</span>
          <div className="flex-1 h-1.5 rounded-full bg-bg-hover relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-1/4 right-1/4 bg-blue/50 rounded-full" />
            {quote && (
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-text-primary rounded-full"
                style={{ 
                  left: `${Math.max(0, Math.min(100, ((quote.price - dayRange.low) / (dayRange.high - dayRange.low)) * 100))}%`,
                  transform: 'translateX(-50%)'
                }} 
              />
            )}
          </div>
          <span>{formatCurrency(dayRange.high)}</span>
        </div>
      </div>

      <div className="p-3 border-b border-border-primary">
        <span className="section-head mb-2 block">Key Stats</span>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map(s => (
            <div key={s.label} className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase">{s.label}</span>
              <span className="text-[12px] font-mono-numbers text-text-primary">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
