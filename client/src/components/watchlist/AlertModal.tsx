import { useState, useEffect } from 'react';
import { X, Bell, BellOff } from 'lucide-react';
import { useWatchlist } from '@/store/useWatchlist';
import { formatCurrency } from '@/lib/utils';
import type { WatchlistItem } from '@/lib/types';

interface AlertModalProps {
  item: WatchlistItem & { currentPrice?: number; alertTriggered?: boolean };
  onClose: () => void;
}

export function AlertModal({ item, onClose }: AlertModalProps) {
  const { updateAlert } = useWatchlist();
  const [alertAbove, setAlertAbove] = useState(item.alertAbove?.toString() ?? '');
  const [alertBelow, setAlertBelow] = useState(item.alertBelow?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateAlert(
      item.id,
      alertAbove ? parseFloat(alertAbove) : undefined,
      alertBelow ? parseFloat(alertBelow) : undefined,
    );
    setSaving(false);
    onClose();
  };

  const handleClear = async () => {
    setSaving(true);
    await updateAlert(item.id, undefined, undefined);
    setSaving(false);
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-sm animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Price Alert — {item.symbol}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {(item as { currentPrice?: number }).currentPrice !== undefined && (
          <div className="bg-black/20 rounded-lg px-3 py-2 mb-4">
            <p className="text-xs text-text-muted">Current Price</p>
            <p className="text-lg font-bold font-mono text-text-primary">
              {formatCurrency((item as { currentPrice?: number }).currentPrice!)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Alert when price rises above
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
              <input
                id="alert-above"
                type="number"
                min="0"
                step="0.01"
                value={alertAbove}
                onChange={(e) => setAlertAbove(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 pl-7 pr-3 text-sm glass-input rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Alert when price drops below
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
              <input
                id="alert-below"
                type="number"
                min="0"
                step="0.01"
                value={alertBelow}
                onChange={(e) => setAlertBelow(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 pl-7 pr-3 text-sm glass-input rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Set Alert'}
          </button>
          {(item.alertAbove || item.alertBelow) && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-3 py-2 rounded-lg border border-border-primary text-xs text-text-secondary hover:bg-white/5 flex items-center gap-1.5 transition-colors"
            >
              <BellOff className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
