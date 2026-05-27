import { useState, useEffect, useRef } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { useWatchlist } from '@/store/useWatchlist';
import { ALL_SYMBOLS, type SymbolInfo } from '@/lib/constants';

interface AddSymbolModalProps {
  onClose: () => void;
}

export function AddSymbolModal({ onClose }: AddSymbolModalProps) {
  const { addSymbol, items } = useWatchlist();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const results: SymbolInfo[] = query.length >= 1
    ? ALL_SYMBOLS.filter((s) =>
        s.symbol.toUpperCase().includes(query.toUpperCase()) ||
        s.name.toUpperCase().includes(query.toUpperCase()),
      ).slice(0, 10)
    : ALL_SYMBOLS.slice(0, 10);

  const watchedSymbols = new Set(items.map((i) => i.symbol));

  const handleAdd = async (symbol: string) => {
    if (watchedSymbols.has(symbol)) return;
    setAdding(symbol);
    await addSymbol(symbol);
    setAdding(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-sm animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol or company…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {results.map((s) => {
            const isWatched = watchedSymbols.has(s.symbol);
            return (
              <button
                key={s.symbol}
                onClick={() => handleAdd(s.symbol)}
                disabled={isWatched || adding === s.symbol}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold font-mono text-text-primary">{s.symbol}</p>
                  <p className="text-xs text-text-muted">{s.name}</p>
                </div>
                {isWatched ? (
                  <span className="text-[10px] text-text-muted">Watching</span>
                ) : adding === s.symbol ? (
                  <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 text-text-muted" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
