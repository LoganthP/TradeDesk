import { Wallet, PieChart, Briefcase, ListOrdered, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { cn, formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useChart } from '@/store/useChart';

export function PortfolioPage() {
  const navigate = useNavigate();
  const setSymbol = useChart(state => state.setSymbol);
  
  const activePortfolio = usePortfolioStore(s => s.activePortfolio);

  const openChart = (symbol: string) => {
    setSymbol(symbol);
    navigate('/dashboard');
  };

  if (!activePortfolio) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <Wallet className="w-12 h-12 text-text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-text-primary mb-2">No Active Portfolio</h2>
        <p className="text-text-muted mb-6">Create or select a portfolio in Settings to begin trading.</p>
        <button 
          onClick={() => navigate('/settings')}
          className="px-6 py-2 bg-blue text-white font-bold rounded hover:bg-blue/90 transition-colors"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  const holdings = activePortfolio.holdings || [];
  const trades = activePortfolio.trades || [];
  const totalValue = activePortfolio.balance + holdings.reduce((acc, h) => acc + (h.quantity * h.currentPrice), 0);
  const totalReturnPercent = ((totalValue - activePortfolio.startingBalance) / activePortfolio.startingBalance) * 100;

  return (
    <div className="w-full h-full p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-3 pb-4 border-b border-border-primary">
        <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight">Portfolio</h1>
          <p className="text-[13px] text-text-muted">Manage your positions, orders, and review performance for {activePortfolio.name}</p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-surface border border-border-primary rounded-xl p-6 shadow-lg flex flex-col justify-center">
          <span className="text-[13px] text-text-muted font-medium mb-1 uppercase tracking-wider">Total Value</span>
          <span className="text-3xl font-mono-numbers font-bold text-text-primary mb-2">
            {formatCurrency(totalValue)}
          </span>
          <span className={cn(
            "text-[13px] font-mono-numbers font-medium px-2 py-1 rounded inline-flex items-center w-fit",
            totalReturnPercent >= 0 ? "text-green bg-green/10" : "text-red bg-red/10"
          )}>
            {totalReturnPercent >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
            {Math.abs(totalReturnPercent).toFixed(2)}% All Time
          </span>
        </div>
        
        <div className="bg-bg-surface border border-border-primary rounded-xl p-6 shadow-lg flex flex-col justify-center">
          <span className="text-[13px] text-text-muted font-medium mb-1 uppercase tracking-wider">Available Cash</span>
          <span className="text-2xl font-mono-numbers font-bold text-text-primary">
            {formatCurrency(activePortfolio.balance)}
          </span>
        </div>

        <div className="bg-bg-surface border border-border-primary rounded-xl p-6 shadow-lg flex flex-col justify-center">
          <span className="text-[13px] text-text-muted font-medium mb-1 uppercase tracking-wider">Open Positions</span>
          <span className="text-2xl font-mono-numbers font-bold text-text-primary">
            {holdings.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions Table */}
        <section className="lg:col-span-2 bg-bg-surface border border-border-primary rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-text-primary" />
            <h2 className="text-[15px] font-bold text-text-primary">Positions</h2>
          </div>
          
          {holdings.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-[13px]">
              No open positions. Use the trade panel to execute a trade.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider">Asset</th>
                    <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider text-right">Shares</th>
                    <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider text-right">Avg Cost</th>
                    <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider text-right">Price</th>
                    <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider text-right">Total Return</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(pos => {
                    const costBasis = pos.quantity * pos.averagePrice;
                    const marketValue = pos.quantity * pos.currentPrice;
                    const returnPct = costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0;
                    return (
                      <tr 
                        key={pos.symbol}
                        onClick={() => openChart(pos.symbol)}
                        className="border-b border-border-subtle hover:bg-bg-hover cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-[14px]">{pos.symbol}</td>
                        <td className="py-3 px-4 text-right font-mono-numbers">{pos.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono-numbers">{formatCurrency(pos.averagePrice)}</td>
                        <td className="py-3 px-4 text-right font-mono-numbers">{formatCurrency(pos.currentPrice)}</td>
                        <td className="py-3 px-4 text-right font-mono-numbers">
                          <span className={cn(
                            "px-2 py-1 rounded text-[13px] font-medium",
                            returnPct >= 0 ? "text-green bg-green/10" : "text-red bg-red/10"
                          )}>
                            {returnPct > 0 ? '+' : ''}{returnPct.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Order History */}
        <section className="bg-bg-surface border border-border-primary rounded-xl p-5 shadow-lg flex flex-col h-full max-h-[600px]">
          <div className="flex items-center gap-2 mb-6">
            <ListOrdered className="w-5 h-5 text-text-primary" />
            <h2 className="text-[15px] font-bold text-text-primary">Order History</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {trades.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-[13px]">
                No recent orders.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {trades.map(trade => (
                  <div key={trade.id} className="p-3 rounded bg-bg-base border border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                          trade.side === 'BUY' ? "text-green bg-green/10" : "text-red bg-red/10"
                        )}>
                          {trade.side}
                        </span>
                        <span className="font-bold text-[13px]">{trade.symbol}</span>
                      </div>
                      <span className="text-[11px] text-text-muted mt-1 block">
                        {new Date(trade.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-numbers text-[13px]">{trade.quantity} shares</div>
                      <div className="font-mono-numbers text-[13px] text-text-muted">@ {formatCurrency(trade.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
