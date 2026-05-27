import { useState } from 'react';
import { History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChart } from '@/store/useChart';

interface Trade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  qty: number;
  price: number;
  pnl: number;
  time: string;
}

function generateMockTrades(symbol: string): Trade[] {
  let cumPnl = 0;
  return Array.from({ length: 50 }).map((_, i) => {
    const isWin = Math.random() > 0.4;
    const pnl = isWin ? Math.random() * 500 + 50 : -(Math.random() * 300 + 50);
    cumPnl += pnl;
    
    return {
      id: `trade-${i}`,
      symbol,
      side: Math.random() > 0.5 ? 'Buy' : 'Sell',
      qty: Math.floor(Math.random() * 100) + 1,
      price: 150 + Math.random() * 20 - 10,
      pnl: pnl,
      time: new Date(Date.now() - i * 1000 * 60 * 60 * 4).toLocaleDateString()
    };
  });
}

export function TradeHistoryPanel() {
  const symbol = useChart(s => s.symbol);
  const [trades] = useState(() => generateMockTrades(symbol));

  const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
  const winRate = trades.filter(t => t.pnl > 0).length / trades.length * 100;

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-primary sticky top-0 bg-bg-base z-10">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue" />
          <h2 className="text-[14px] font-bold tracking-tight">Trade History</h2>
        </div>
      </div>

      <div className="p-3 border-b border-border-primary flex items-center justify-between bg-bg-surface/30">
        <div className="flex flex-col">
          <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Total P&L</span>
          <span className={cn("text-[16px] font-mono font-bold", totalPnl >= 0 ? "text-green-500" : "text-red-500")}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Win Rate</span>
          <span className="text-[16px] font-mono font-bold text-text-primary">
            {winRate.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-bg-surface/90 backdrop-blur z-10">
            <tr className="text-[11px] text-text-muted font-medium border-b border-border-primary">
              <th className="py-1.5 px-3 font-normal">Sym/Side</th>
              <th className="py-1.5 px-3 font-normal text-right">Price</th>
              <th className="py-1.5 px-3 font-normal text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(trade => (
              <tr key={trade.id} className="border-b border-border-primary/50 hover:bg-bg-hover group transition-colors cursor-default">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1 h-5 rounded-full", trade.side === 'Buy' ? "bg-blue" : "bg-red")} />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold leading-tight">{trade.symbol}</span>
                      <span className="text-[11px] text-text-muted">{trade.time}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-mono">{trade.price.toFixed(2)}</span>
                    <span className="text-[11px] text-text-muted font-mono">{trade.qty} shares</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className={cn(
                    "text-[13px] font-mono font-medium flex items-center justify-end gap-1",
                    trade.pnl > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {trade.pnl > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    ${Math.abs(trade.pnl).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
