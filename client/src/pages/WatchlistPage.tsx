import { useState } from 'react';
import { Star, Plus, Bell } from 'lucide-react';
import { useWatchlist } from '@/store/useWatchlist';
import { useChart } from '@/store/useChart';
import { usePriceStream } from '@/hooks/usePriceStream';
import { formatCurrency, formatPercent, getChangeColor, cn } from '@/lib/utils';
import { AlertModal } from '@/components/watchlist/AlertModal';
import { AddSymbolModal } from '@/components/watchlist/AddSymbolModal';
import { useNavigate } from 'react-router-dom';
import type { WatchlistItem } from '@/lib/types';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

function WatchlistRow({ item }: { item: WatchlistItem }) {
  const setSymbol = useChart((s) => s.setSymbol);
  const { removeSymbol } = useWatchlist();
  const { quote } = usePriceStream(item.symbol);
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);

  const hasAlert = (item.alertAbove !== undefined && item.alertAbove !== null) ||
    (item.alertBelow !== undefined && item.alertBelow !== null);

  const alertTriggered = quote && (
    (item.alertAbove !== null && item.alertAbove !== undefined && quote.price >= item.alertAbove) ||
    (item.alertBelow !== null && item.alertBelow !== undefined && quote.price <= item.alertBelow)
  );

  const changeColor = getChangeColor(quote?.change ?? 0);

  const handleNavigate = () => {
    setSymbol(item.symbol);
    navigate('/dashboard');
  };

  return (
    <>
      <div className="glass-card p-4 flex items-center gap-4 hover:border-accent/30 transition-all group cursor-pointer">
        {/* Symbol info */}
        <button onClick={handleNavigate} className="flex-1 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-accent">{item.symbol.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-text-primary">{item.symbol}</span>
                {alertTriggered && (
                  <span className="px-1.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 text-[10px] font-bold">ALERT</span>
                )}
              </div>
              {quote ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-semibold font-mono text-text-primary">
                    {formatCurrency(quote.price)}
                  </span>
                  <span className={cn('text-xs font-mono flex items-center gap-0.5', changeColor)}>
                    {quote.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(quote.changePercent)}
                  </span>
                </div>
              ) : (
                <div className="h-4 w-24 skeleton rounded mt-1" />
              )}
            </div>
          </div>
        </button>

        {/* Alerts info */}
        <div className="text-right hidden sm:block">
          {hasAlert ? (
            <div className="text-xs text-text-muted">
              {item.alertAbove && <p className="text-profit">↑ {formatCurrency(item.alertAbove)}</p>}
              {item.alertBelow && <p className="text-loss">↓ {formatCurrency(item.alertBelow)}</p>}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No alert</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowAlert(true)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              hasAlert ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10' : 'text-text-muted hover:text-text-secondary hover:bg-white/5',
            )}
            title="Set price alert"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => removeSymbol(item.id)}
            className="p-2 rounded-lg text-text-muted hover:text-loss hover:bg-loss/10 transition-colors"
            title="Remove from watchlist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showAlert && (
        <AlertModal
          item={{ ...item, currentPrice: quote?.price }}
          onClose={() => setShowAlert(false)}
        />
      )}
    </>
  );
}

export function WatchlistPage() {
  const { items, isLoading } = useWatchlist();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Watchlist</h1>
            <p className="text-xs text-text-muted">{items.length} symbol{items.length !== 1 ? 's' : ''} watched</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Symbol
        </button>
      </div>

      {/* Items */}
      {isLoading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-text-secondary mb-5">Add symbols to track prices and set alerts</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            Add Your First Symbol
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <WatchlistRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {showAdd && <AddSymbolModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
