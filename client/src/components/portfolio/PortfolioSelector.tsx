import { useState } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { formatCurrency } from '@/lib/utils';
import { STARTING_BALANCES } from '@/lib/constants';

export function PortfolioSelector() {
  const { portfolios, activePortfolioId, setActivePortfolio, activePortfolio, createPortfolio } = usePortfolioStore();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState(100_000);

  const handleCreate = () => {
    createPortfolio(newName || 'New Portfolio', newBalance);
    setShowCreate(false);
    setNewName('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        id="portfolio-selector"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 glass-input rounded-lg text-xs"
      >
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
        <span className="font-medium text-text-primary max-w-[120px] truncate">
          {activePortfolio?.name ?? 'Select Portfolio'}
        </span>
        {activePortfolio && (
          <span className="text-text-muted">
            ({formatCurrency(activePortfolio.balance)})
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-text-muted ml-1" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 min-w-[220px] bg-bg-secondary border border-border-primary rounded-lg shadow-2xl z-50 overflow-hidden animate-scale-in">
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActivePortfolio(p.id); setOpen(false); }}
              className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-accent/10 transition-colors"
            >
              <div>
                <p className="text-xs font-medium text-text-primary">{p.name}</p>
                <p className="text-[11px] text-text-muted font-mono">
                  {formatCurrency(p.balance)}
                </p>
              </div>
              {p.id === activePortfolioId && (
                <Check className="w-3.5 h-3.5 text-accent" />
              )}
            </button>
          ))}

          {/* Create new */}
          <div className="border-t border-border-subtle">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full px-3 py-2.5 flex items-center gap-2 text-xs text-accent hover:bg-accent/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Portfolio
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Portfolio name"
                  className="w-full h-8 px-2 text-xs glass-input rounded-lg"
                  autoFocus
                />
                <select
                  value={newBalance}
                  onChange={(e) => setNewBalance(Number(e.target.value))}
                  className="w-full h-8 px-2 text-xs glass-input rounded-lg"
                >
                  {STARTING_BALANCES.map((b) => (
                    <option key={b} value={b}>{formatCurrency(b)}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="btn-primary flex-1 text-xs py-1.5"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-3 py-1.5 text-xs text-text-secondary hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
