import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

type TabType = 'OPEN' | 'FILLED' | 'ALL';

function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OPEN': return (
      <span className="flex items-center gap-1 text-amber text-[11px] font-semibold">
        <Clock className="w-3 h-3" /> Open
      </span>
    );
    case 'FILLED': return (
      <span className="flex items-center gap-1 text-green text-[11px] font-semibold">
        <CheckCircle2 className="w-3 h-3" /> Filled
      </span>
    );
    case 'CANCELLED': return (
      <span className="flex items-center gap-1 text-text-muted text-[11px] font-semibold">
        <XCircle className="w-3 h-3" /> Cancelled
      </span>
    );
    default: return <span className="text-[11px] text-text-muted">{status}</span>;
  }
}

function OrderRow({ order }: {
  order: any;
}) {
  return (
    <tr className="group hover:bg-bg-hover transition-colors border-b border-border-primary/50 last:border-0">
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[13px] text-text-primary">{order.symbol}</span>
          <span className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-bold',
            order.side === 'BUY' ? 'text-green bg-green/10' : 'text-red bg-red/10',
          )}>
            {order.side}
          </span>
        </div>
      </td>
      <td className="py-2 px-3 text-[12px] text-text-secondary">{order.type}</td>
      <td className="py-2 px-3 text-[12px] font-mono-numbers text-text-primary text-right">{order.quantity}</td>
      <td className="py-2 px-3 text-[12px] font-mono-numbers text-text-secondary text-right">
        {order.price ? formatCurrency(order.price) : '—'}
      </td>
      <td className="py-2 px-3 text-center">
        <OrderStatusBadge status={'FILLED'} />
      </td>
      <td className="py-2 px-3 text-[12px] font-mono-numbers text-text-muted">{formatDate(order.timestamp)}</td>
      <td className="py-2 px-3 text-right">
      </td>
    </tr>
  );
}

export function OrderBook() {
  const { activePortfolio } = usePortfolioStore();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const orders = activePortfolio?.trades ?? [];

  const filteredOrders: any[] = orders.filter(() => {
    if (activeTab === 'ALL') return true;
    return 'FILLED' === activeTab;
  });

  const openCount = 0;
  const filledCount = orders.length;

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'OPEN', label: 'Open', count: openCount },
    { key: 'FILLED', label: 'Filled', count: filledCount },
    { key: 'ALL', label: 'All' },
  ];

  return (
    <div 
      className={cn(
        "flex flex-col bg-bg-surface border-t border-border-primary transition-[height] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
        drawerOpen ? "h-[260px]" : "h-8"
      )}
    >
      <div 
        className="flex items-center px-4 h-8 flex-shrink-0 cursor-pointer select-none hover:bg-bg-hover transition-colors"
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        <span className="text-[12px] font-medium text-text-primary flex-1 tracking-wide">
          Open {openCount} <span className="text-text-muted/40 mx-2">|</span> Filled {filledCount} <span className="text-text-muted/40 mx-2">|</span> All {orders.length}
        </span>
        {drawerOpen ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronUp className="w-4 h-4 text-text-muted" />}
      </div>
      
      <div className="flex flex-col flex-1 min-h-0 bg-bg-base border-t border-border-primary">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-border-primary flex-shrink-0 bg-bg-surface">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border-b-2 -mb-px transition-colors duration-150',
                activeTab === tab.key
                  ? 'border-blue text-blue'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-text-muted/30',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-[13px] text-text-secondary">No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} orders</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-bg-surface sticky top-0 z-10 shadow-sm border-b border-border-primary">
                <tr>
                  <th className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Symbol</th>
                  <th className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Type</th>
                  <th className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-right">Qty</th>
                  <th className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-right">Price</th>
                  <th className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
                  <th className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Date</th>
                  <th className="px-3 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
