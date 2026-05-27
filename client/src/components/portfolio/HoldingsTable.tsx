import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useChart } from '@/store/useChart';
import { cn, formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { Package } from 'lucide-react';

export function HoldingsTable() {
  const { activePortfolio } = usePortfolioStore();
  const setSymbol = useChart((state) => state.setSymbol);
  const positions = activePortfolio?.holdings ?? [];

  if (!activePortfolio || positions.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Package className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-sm text-text-secondary font-medium">No open positions</p>
        <p className="text-xs text-text-muted mt-1">Place a BUY order to add holdings</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Holdings ({positions.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="trading-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Avg Cost</th>
              <th className="text-right">Price</th>
              <th className="text-right">Mkt Value</th>
              <th className="text-right">Unreal. P&L</th>
              <th className="text-right">Return</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const marketValue = position.quantity * position.currentPrice;
              const costBasis = position.quantity * position.averagePrice;
              const pnl = position.unrealizedPnL;
              const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
              const pnlColor = getChangeColor(pnl);

              return (
                <tr
                  key={position.symbol}
                  className="cursor-pointer"
                  onClick={() => setSymbol(position.symbol)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-accent">{position.symbol.charAt(0)}</span>
                      </div>
                      <span className="font-mono font-semibold text-xs text-text-primary">{position.symbol}</span>
                    </div>
                  </td>
                  <td className="text-right font-mono text-xs text-text-primary">{position.quantity}</td>
                  <td className="text-right font-mono text-xs text-text-secondary">{formatCurrency(position.averagePrice)}</td>
                  <td className="text-right font-mono text-xs text-text-primary">{formatCurrency(position.currentPrice)}</td>
                  <td className="text-right font-mono text-xs text-text-primary">{formatCurrency(marketValue)}</td>
                  <td className={cn('text-right font-mono text-xs font-semibold', pnlColor)}>
                    {pnl > 0 ? '+' : ''}{formatCurrency(pnl)}
                  </td>
                  <td className={cn('text-right font-mono text-xs font-semibold', pnlColor)}>
                    {formatPercent(pnlPct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
