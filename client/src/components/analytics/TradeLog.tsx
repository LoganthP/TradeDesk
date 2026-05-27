import { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

type SortField = 'date' | 'symbol' | 'side' | 'qty' | 'fillPrice' | 'pnl';
type SortDir = 'asc' | 'desc';

function SortHeader({ field, label, sort, onSort }: {
  field: SortField;
  label: string;
  sort: { field: SortField; dir: SortDir };
  onSort: (f: SortField) => void;
}) {
  const active = sort.field === field;
  return (
    <th
      className="cursor-pointer select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 hover:text-text-secondary transition-colors">
        {label}
        {active ? (
          sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </div>
    </th>
  );
}

export function TradeLog() {
  const { activePortfolio } = usePortfolioStore();
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'date', dir: 'desc' });

  const toggleSort = (field: SortField) => {
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const orders: any[] = activePortfolio?.trades ?? [];

  const sorted = [...orders].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'date': cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); break;
      case 'symbol': cmp = a.symbol.localeCompare(b.symbol); break;
      case 'side': cmp = a.side.localeCompare(b.side); break;
      case 'qty': cmp = a.quantity - b.quantity; break;
      case 'fillPrice': cmp = (a.price ?? 0) - (b.price ?? 0); break;
    }
    return sort.dir === 'asc' ? cmp : -cmp;
  });


  if (sorted.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-text-secondary">No filled trades yet</p>
        <p className="text-xs text-text-muted mt-1">Place and fill some orders to see your trade log</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Trade Log</h3>
        <span className="text-xs text-text-muted">{sorted.length} fills</span>
      </div>
      <div className="overflow-x-auto">
        <table className="trading-table">
          <thead>
            <tr>
              <SortHeader field="date" label="Date" sort={sort} onSort={toggleSort} />
              <SortHeader field="symbol" label="Symbol" sort={sort} onSort={toggleSort} />
              <SortHeader field="side" label="Side" sort={sort} onSort={toggleSort} />
              <SortHeader field="qty" label="Qty" sort={sort} onSort={toggleSort} />
              <SortHeader field="fillPrice" label="Fill Price" sort={sort} onSort={toggleSort} />
              <th className="text-right">Type</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((order) => (
              <tr key={order.id}>
                <td className="text-xs text-text-muted">{formatDate(order.timestamp)}</td>
                <td>
                  <span className="font-mono font-semibold text-xs text-text-primary">{order.symbol}</span>
                </td>
                <td>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold',
                    order.side === 'BUY' ? 'text-profit bg-profit/10' : 'text-loss bg-loss/10',
                  )}>
                    {order.side}
                  </span>
                </td>
                <td className="font-mono text-xs text-text-primary">{order.quantity}</td>
                <td className="font-mono text-xs text-text-primary text-right">
                  {order.price ? formatCurrency(order.price) : '—'}
                </td>
                <td className="text-right">
                  <span className="text-[10px] text-text-muted">{order.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
