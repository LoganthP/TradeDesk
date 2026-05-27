import { Briefcase } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { formatCurrency } from '@/lib/utils';
import { OrderForm } from '@/components/orders/OrderForm';

export function TradingPanel() {
  const activePortfolio = usePortfolioStore((s) => s.activePortfolio);

  const balance = activePortfolio?.balance ?? 0;
  const startingBalance = activePortfolio?.startingBalance ?? 0;
  const holdings = activePortfolio?.holdings ?? [];
  const trades = activePortfolio?.trades ?? [];

  const holdingsValue = holdings.reduce((sum, holding) => sum + holding.quantity * holding.currentPrice, 0);
  const equity = balance + holdingsValue;
  const unrealizedPnL = holdings.reduce((sum, holding) => sum + holding.unrealizedPnL, 0);
  const dailyPnL = equity - startingBalance;
  const buyingPower = balance;

  return (
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary overflow-hidden">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border-primary sticky top-0 bg-bg-base z-10">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Trading Panel</h2>
            <p className="text-[11px] text-text-muted">Account overview and quick trade</p>
          </div>
        </div>
      </div>

      <div className="h-full overflow-y-auto px-3 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">Available Balance</p>
            <p className="text-lg font-semibold">{formatCurrency(balance)}</p>
          </div>
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">Equity</p>
            <p className="text-lg font-semibold">{formatCurrency(equity)}</p>
          </div>
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">Buying Power</p>
            <p className="text-lg font-semibold">{formatCurrency(buyingPower)}</p>
          </div>
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">Unrealized P&amp;L</p>
            <p className={`text-lg font-semibold ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(unrealizedPnL)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-border-primary bg-bg-surface p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">Daily P&amp;L</p>
            <p className={`text-lg font-semibold ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(dailyPnL)}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-border-primary bg-bg-surface overflow-hidden">
          <div className="px-3 py-3 border-b border-border-primary text-[11px] uppercase tracking-[0.24em] font-semibold text-text-muted">
            Quick Trade
          </div>
          <div className="p-3">
            <OrderForm />
          </div>
        </section>

        <section className="rounded-2xl border border-border-primary bg-bg-surface overflow-hidden">
          <div className="px-3 py-3 border-b border-border-primary text-[11px] uppercase tracking-[0.24em] font-semibold text-text-muted">
            Positions
          </div>
          <div className="p-3 space-y-3">
            {holdings.length > 0 ? (
              holdings.map((holding) => (
                <div key={holding.symbol} className="rounded-xl border border-border-secondary bg-bg-base p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold">{holding.symbol}</span>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-text-muted">Qty {holding.quantity}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[13px] text-text-muted">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] mb-1">Avg Price</p>
                      <p className="font-medium text-text-primary">{formatCurrency(holding.averagePrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] mb-1">Current P&amp;L</p>
                      <p className={`${holding.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>{formatCurrency(holding.unrealizedPnL)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border-secondary bg-bg-base p-3 text-sm text-text-muted">
                No open positions yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border-primary bg-bg-surface overflow-hidden">
          <div className="px-3 py-3 border-b border-border-primary text-[11px] uppercase tracking-[0.24em] font-semibold text-text-muted">
            Order History
          </div>
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-border-secondary bg-bg-base p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-1">Filled</p>
                <p className="text-lg font-semibold">{trades.length}</p>
              </div>
              <div className="rounded-2xl border border-border-secondary bg-bg-base p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-1">Pending</p>
                <p className="text-lg font-semibold">0</p>
              </div>
              <div className="rounded-2xl border border-border-secondary bg-bg-base p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted mb-1">Cancelled</p>
                <p className="text-lg font-semibold">0</p>
              </div>
            </div>
            <div className="rounded-xl border border-border-secondary bg-bg-base overflow-hidden">
              <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr] gap-2 px-3 py-2 bg-bg-surface text-[10px] uppercase tracking-[0.2em] text-text-muted">
                <span>Symbol</span>
                <span>Side</span>
                <span>Qty</span>
                <span>Price</span>
              </div>
              <div className="space-y-1">
                {trades.length > 0 ? (
                  trades.slice(0, 5).map((trade) => (
                    <div key={trade.id} className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr] gap-2 px-3 py-2 text-sm text-text-primary bg-bg-base hover:bg-bg-hover transition-colors">
                      <span className="font-medium">{trade.symbol}</span>
                      <span className={`${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'} font-semibold`}>{trade.side}</span>
                      <span>{trade.quantity}</span>
                      <span>{formatCurrency(trade.price)}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-text-muted">No orders placed yet.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
