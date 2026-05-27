import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Edit3,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { usePortfolioStore, type Portfolio } from '@/store/usePortfolioStore';
import { useToast } from '@/store/useToast';
import { STARTING_BALANCES } from '@/lib/constants';
import { cn, formatCurrency, formatShortDate } from '@/lib/utils';

type EditingState = {
  id: string;
  name: string;
  startingBalance: number;
};

const templates = [
  { name: 'Swing Trading', balance: 50_000 },
  { name: 'Options Lab', balance: 25_000 },
  { name: 'Long-Term Core', balance: 100_000 },
];

function getPortfolioValue(portfolio: Portfolio) {
  return portfolio.balance + portfolio.holdings.reduce((sum, holding) => {
    return sum + holding.quantity * holding.currentPrice;
  }, 0);
}

function getPortfolioPnl(portfolio: Portfolio) {
  const value = getPortfolioValue(portfolio);
  return {
    value,
    pnl: value - portfolio.startingBalance,
    pnlPercent: portfolio.startingBalance > 0
      ? ((value - portfolio.startingBalance) / portfolio.startingBalance) * 100
      : 0,
  };
}

export function PortfolioManager() {
  const {
    portfolios,
    activePortfolioId,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    setActivePortfolio,
    resetPortfolio,
  } = usePortfolioStore();
  const { addToast } = useToast();

  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioBalance, setNewPortfolioBalance] = useState(100_000);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Portfolio | null>(null);

  const activePortfolio = useMemo(
    () => portfolios.find((portfolio) => portfolio.id === activePortfolioId) ?? null,
    [activePortfolioId, portfolios],
  );

  const handleCreate = (name = newPortfolioName, balance = newPortfolioBalance) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      addToast({ type: 'error', title: 'Portfolio name is required' });
      return;
    }

    createPortfolio(trimmedName, balance);
    setNewPortfolioName('');
    setNewPortfolioBalance(100_000);
    addToast({ type: 'success', title: 'Portfolio Created' });
  };

  const handleUpdate = () => {
    if (!editing) return;
    const trimmedName = editing.name.trim();

    if (!trimmedName) {
      addToast({ type: 'error', title: 'Portfolio name is required' });
      return;
    }

    updatePortfolio(editing.id, {
      name: trimmedName,
      startingBalance: editing.startingBalance,
    });
    setEditing(null);
    addToast({ type: 'success', title: 'Portfolio Updated' });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    deletePortfolio(deleteTarget.id);
    setDeleteTarget(null);
    addToast({ type: 'success', title: 'Portfolio Deleted' });
  };

  const handleReset = (portfolio: Portfolio) => {
    resetPortfolio(portfolio.id);
    addToast({ type: 'success', title: 'Portfolio Reset' });
  };

  return (
    <section className="bg-bg-surface border border-border-primary rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <WalletCards className="w-5 h-5 text-text-primary" />
          <h2 className="text-[15px] font-bold text-text-primary">Portfolios</h2>
        </div>
        <span className="text-[13px] font-mono-numbers text-text-muted">{portfolios.length} Total</span>
      </div>

      <div className="border border-border-subtle bg-bg-base rounded-lg p-4 mb-4">
        <h3 className="text-[13px] font-bold text-text-primary mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Portfolio
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2 mb-3">
          <input
            type="text"
            value={newPortfolioName}
            onChange={(event) => setNewPortfolioName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreate();
            }}
            placeholder="Portfolio name"
            className="h-9 px-3 text-[13px] bg-bg-elevated border border-border-subtle rounded focus:border-border-focus outline-none"
          />
          <select
            value={newPortfolioBalance}
            onChange={(event) => setNewPortfolioBalance(Number(event.target.value))}
            className="h-9 px-3 text-[13px] bg-bg-elevated border border-border-subtle rounded focus:border-border-focus outline-none font-mono-numbers"
          >
            {STARTING_BALANCES.map((balance) => (
              <option key={balance} value={balance}>{formatCurrency(balance)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleCreate()}
          className="w-full py-2 bg-blue hover:bg-blue/90 text-white text-[13px] font-bold rounded transition-colors disabled:opacity-50"
        >
          Create Portfolio
        </button>
      </div>

      {portfolios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-primary bg-bg-base p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue/10">
            <LayoutTemplate className="h-6 w-6 text-blue" />
          </div>
          <h3 className="text-[14px] font-bold text-text-primary">No portfolios created yet</h3>
          <p className="mt-1 text-[12px] text-text-muted">Start from a blank paper account or use a template.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => handleCreate(template.name, template.balance)}
                className="rounded border border-border-subtle bg-bg-elevated px-3 py-2 text-left hover:border-blue/60 hover:bg-blue/10 transition-colors"
              >
                <span className="block text-[12px] font-bold text-text-primary">{template.name}</span>
                <span className="block text-[11px] text-text-muted font-mono-numbers">{formatCurrency(template.balance)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {portfolios.map((portfolio) => {
              const stats = getPortfolioPnl(portfolio);
              const isActive = portfolio.id === activePortfolio?.id;
              const isEditing = editing?.id === portfolio.id;

              return (
                <motion.div
                  key={portfolio.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -18, scale: 0.98 }}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setActivePortfolio(portfolio.id)}
                  className={cn(
                    'rounded-lg border p-4 cursor-pointer transition-colors',
                    isActive
                      ? 'border-blue bg-blue/5 shadow-[0_0_24px_rgba(41,98,255,0.12)]'
                      : 'border-border-subtle bg-bg-base hover:border-border-primary hover:bg-bg-hover',
                  )}
                >
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        value={editing.name}
                        onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                        className="h-9 px-3 text-[13px] bg-bg-elevated border border-border-subtle rounded focus:border-border-focus outline-none"
                        autoFocus
                      />
                      <select
                        value={editing.startingBalance}
                        onChange={(event) => setEditing({ ...editing, startingBalance: Number(event.target.value) })}
                        className="h-9 px-3 text-[13px] bg-bg-elevated border border-border-subtle rounded focus:border-border-focus outline-none font-mono-numbers"
                      >
                        {STARTING_BALANCES.map((balance) => (
                          <option key={balance} value={balance}>{formatCurrency(balance)}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdate}
                          className="flex items-center justify-center gap-2 rounded bg-blue px-3 py-2 text-[12px] font-bold text-white hover:bg-blue/90 transition-colors"
                        >
                          <Check className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="flex items-center justify-center gap-2 rounded border border-border-subtle px-3 py-2 text-[12px] font-bold text-text-secondary hover:bg-bg-elevated transition-colors"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-[14px] font-bold text-text-primary">{portfolio.name}</h3>
                            {isActive && (
                              <span className="shrink-0 text-[10px] text-blue font-bold uppercase tracking-wider bg-blue/10 px-2 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-text-muted">
                            Created {formatShortDate(new Date(portfolio.createdAt))}
                          </p>
                        </div>
                        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                          <button
                            onClick={() => setEditing({
                              id: portfolio.id,
                              name: portfolio.name,
                              startingBalance: portfolio.startingBalance,
                            })}
                            className="p-1.5 rounded text-text-muted hover:text-blue hover:bg-blue/10 transition-colors"
                            title="Edit portfolio"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReset(portfolio)}
                            className="p-1.5 rounded text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                            title="Reset portfolio"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(portfolio)}
                            className="p-1.5 rounded text-text-muted hover:text-red hover:bg-red/10 transition-colors"
                            title="Delete portfolio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Metric label="Balance" value={formatCurrency(portfolio.balance)} />
                        <Metric
                          label="P&L"
                          value={`${stats.pnl >= 0 ? '+' : ''}${formatCurrency(stats.pnl)}`}
                          accent={stats.pnl >= 0 ? 'text-green' : 'text-red'}
                        />
                        <Metric label="Holdings" value={portfolio.holdings.length.toString()} />
                        <Metric
                          label="Return"
                          value={`${stats.pnlPercent >= 0 ? '+' : ''}${stats.pnlPercent.toFixed(2)}%`}
                          accent={stats.pnlPercent >= 0 ? 'text-green' : 'text-red'}
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-sm rounded-xl border border-border-primary bg-bg-surface p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red/10">
                  <AlertTriangle className="h-5 w-5 text-red" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">Delete portfolio?</h3>
                  <p className="text-[12px] text-text-muted">{deleteTarget.name} will be removed permanently.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded border border-border-subtle px-4 py-2 text-[13px] font-bold text-text-secondary hover:bg-bg-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded bg-red px-4 py-2 text-[13px] font-bold text-white hover:bg-red/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded border border-border-subtle bg-bg-elevated px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cn('mt-1 truncate font-mono-numbers text-[13px] font-bold text-text-primary', accent)}>
        {value}
      </p>
    </div>
  );
}
