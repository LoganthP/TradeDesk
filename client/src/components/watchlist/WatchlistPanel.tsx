// @ts-nocheck
import { useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Star, StarOff, Bell } from 'lucide-react';
import { useWatchlist } from '@/store/useWatchlist';
import { useChart } from '@/store/useChart';
import { usePriceStream } from '@/hooks/usePriceStream';
import { formatPercent, getChangeColor, cn } from '@/lib/utils';
import { AlertModal } from './AlertModal';
import { SymbolDetail } from './SymbolDetail';
import type { WatchlistItem } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface WatchlistRowProps {
  item: WatchlistItem;
  onAlert: (item: WatchlistItem) => void;
  onContextMenu: (e: MouseEvent, item: WatchlistItem, price: number) => void;
}

function WatchlistRow({ item, onAlert, onContextMenu }: WatchlistRowProps) {
  const { symbol, setSymbol } = useChart();
  const { quote } = usePriceStream(item.symbol);
  const changeColor = getChangeColor(quote?.change ?? 0);

  const alertTriggered = quote && (
    (item.alertAbove !== undefined && item.alertAbove !== null && quote.price >= item.alertAbove) ||
    (item.alertBelow !== undefined && item.alertBelow !== null && quote.price <= item.alertBelow)
  );

  return (
    <div 
      onContextMenu={(e) => onContextMenu(e, item, quote?.price || 0)}
      onClick={() => setSymbol(item.symbol)}
      className={cn(
        "flex items-center justify-between px-3 py-1 hover:bg-bg-hover transition-colors group cursor-pointer border-b border-border-primary/50 last:border-0",
        symbol === item.symbol && "bg-bg-hover"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[13px] font-bold text-text-primary tracking-tight">{item.symbol}</span>
        {alertTriggered && <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-slow" title="Alert triggered" />}
      </div>
      
      {quote ? (
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-mono-numbers text-text-primary w-16 text-right">
            {quote.price.toFixed(2)}
          </span>
          <span className={cn('text-[13px] font-mono-numbers w-14 text-right', changeColor)}>
            {formatPercent(quote.changePercent)}
          </span>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="h-4 w-12 bg-bg-hover rounded animate-pulse" />
          <div className="h-4 w-12 bg-bg-hover rounded animate-pulse" />
        </div>
      )}
    </div>
  );
}

export function WatchlistPanel() {
  const { items, isLoading, refresh, removeSymbol } = useWatchlist();
  const [alertItem, setAlertItem] = useState<WatchlistItem | null>(null);
  const [sortCol, setSortCol] = useState<'symbol'|'price'|'change'>('symbol');
  const [sortAsc, setSortAsc] = useState(true);

  // Context menu state
  const [menu, setMenu] = useState<{ x: number, y: number, item: WatchlistItem, price: number } | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleContextMenu = (e: MouseEvent, item: WatchlistItem, currentPrice: number) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, item, price: currentPrice });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortCol === 'symbol') {
      return sortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
    }
    return 0; // Proper price/change sorting requires live quotes which are inside the row. For real app we'd sort by last known price.
  });

  const handleSort = (col: 'symbol'|'price'|'change') => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-primary flex-shrink-0">
        <h2 className="text-[14px] font-bold tracking-tight">Watchlist</h2>
        <div className="flex items-center gap-1" />
      </div>

      {/* Columns Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border-primary text-[11px] text-text-muted font-medium uppercase">
        <button onClick={() => handleSort('symbol')} className="hover:text-text-primary flex-1 text-left">Symbol</button>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSort('price')} className="hover:text-text-primary w-16 text-right">Last</button>
          <button onClick={() => handleSort('change')} className="hover:text-text-primary w-14 text-right">Chg%</button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && items.length === 0 ? (
          <div className="p-3 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-bg-hover rounded animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Star className="w-8 h-8 text-text-muted mb-3 opacity-50" />
            <p className="text-[13px] text-text-secondary">No symbols watched</p>
          </div>
        ) : (
          <div className="flex flex-col pb-2">
            {sortedItems.map((item) => (
              <WatchlistRow
                key={item.id}
                item={item}
                onAlert={setAlertItem}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Split Panel */}
      <div className="h-[40%] min-h-[250px] flex flex-col border-t border-border-primary relative">
        {/* Resize Handle (Visual Only) */}
        <div className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue/50 z-10" />
        <SymbolDetail />
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.1 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="fixed z-50 bg-bg-elevated border border-border-primary rounded shadow-xl py-1 w-48"
            style={{ 
              left: menu.x + 8 > window.innerWidth - 200 ? window.innerWidth - 200 : menu.x + 8, 
              top: menu.y + 4 > window.innerHeight - 150 ? window.innerHeight - 150 : menu.y + 4 
            }}
          >
            <button 
              onClick={() => setAlertItem(menu.item)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover text-[13px] text-text-primary text-left"
            >
              <Bell className="w-4 h-4 text-text-muted" /> Add alert on {menu.item.symbol}
            </button>
            <div className="h-px bg-border-primary my-1" />
            <button 
              onClick={() => removeSymbol(menu.item.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover text-[13px] text-red text-left"
            >
              <StarOff className="w-4 h-4" /> Remove {menu.item.symbol}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {alertItem && (
        <AlertModal item={alertItem as WatchlistItem & { currentPrice?: number; alertTriggered?: boolean }} onClose={() => setAlertItem(null)} />
      )}
    </div>
  );
}
