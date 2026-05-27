import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalScale } from '@/lib/animationVariants';
import { X, Search, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useIndicatorStore, type IndicatorType, type IndicatorSettings } from '@/store/useIndicatorStore';
import { cn } from '@/lib/utils';

interface IndicatorsModalProps {
  onClose: () => void;
  initialExpandedId?: string | null;
}

const ALL_INDICATORS: Omit<IndicatorType, 'enabled' | 'settings'>[] = [
  { id: 'Vol',   name: 'Volume',                          category: 'Volume' },
  { id: 'EMA9',  name: 'Exponential Moving Average (9)',  category: 'Moving Averages' },
  { id: 'EMA21', name: 'Exponential Moving Average (21)', category: 'Moving Averages' },
  { id: 'EMA50', name: 'Exponential Moving Average (50)', category: 'Moving Averages' },
  { id: 'VWAP',  name: 'Volume Weighted Average Price',   category: 'Volume' },
  { id: 'BB',    name: 'Bollinger Bands',                 category: 'Volatility' },
];

const CATEGORY_ORDER = ['Moving Averages', 'Volume', 'Volatility'];

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[11px] text-text-muted w-28 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function NumberInput({
  value, onChange, min, max, step = 1,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      className="w-20 bg-bg-void border border-border-primary rounded px-2 py-0.5 text-[12px] text-text-primary text-right focus:border-blue outline-none"
    />
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="cursor-pointer relative">
      <input
        type="color"
        value={value.startsWith('rgba') ? '#9575CD' : value}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
      <div
        className="w-6 h-6 rounded border border-border-primary"
        style={{ background: value }}
      />
    </label>
  );
}

function IndicatorSettingsPanel({
  indicator,
  onUpdate,
}: {
  indicator: IndicatorType;
  onUpdate: (settings: IndicatorSettings) => void;
}) {
  const s = indicator.settings;

  return (
    <div className="mt-2 px-4 py-2 bg-bg-void rounded-md border border-border-subtle space-y-1">
      {/* Period */}
      {s.period !== undefined && (
        <SettingsRow label="Period">
          <NumberInput value={s.period} min={1} max={500} onChange={v => onUpdate({ period: v })} />
        </SettingsRow>
      )}
      {/* StdDev (BB) */}
      {s.stdDev !== undefined && (
        <SettingsRow label="Std Deviation">
          <NumberInput value={s.stdDev} min={0.1} max={5} step={0.1} onChange={v => onUpdate({ stdDev: v })} />
        </SettingsRow>
      )}
      {/* Color */}
      {s.color !== undefined && (
        <SettingsRow label="Color">
          <ColorSwatch value={s.color} onChange={v => onUpdate({ color: v })} />
        </SettingsRow>
      )}
      {/* Line Width */}
      {s.lineWidth !== undefined && (
        <SettingsRow label="Thickness">
          <div className="flex items-center gap-1">
            {[1, 1.5, 2, 3].map(w => (
              <button
                key={w}
                onClick={() => onUpdate({ lineWidth: w })}
                className={cn(
                  'px-2 py-0.5 text-[11px] rounded border transition-colors',
                  s.lineWidth === w
                    ? 'border-blue text-blue bg-blue/10'
                    : 'border-border-primary text-text-muted hover:border-text-muted'
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </SettingsRow>
      )}
    </div>
  );
}

export function IndicatorsModal({ onClose, initialExpandedId = null }: IndicatorsModalProps) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId);
  const { indicators, toggleIndicator, updateIndicatorSettings } = useIndicatorStore();

  const getIndicatorState = (id: string) =>
    indicators.find(i => i.id === id) ??
    { id, name: '', category: '', enabled: false, settings: {} } as IndicatorType;

  const filtered = ALL_INDICATORS.filter(ind =>
    ind.name.toLowerCase().includes(search.toLowerCase()) ||
    ind.id.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      items: filtered.filter(i => i.category === cat),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-void/60 backdrop-blur-sm p-4">
      <motion.div
        variants={modalScale} initial="hidden" animate="visible" exit="exit"
        className="bg-bg-base border border-border-primary rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden h-[600px] max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary shrink-0">
          <h2 className="text-[18px] font-bold text-text-primary tracking-tight">Indicators</h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-surface rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-primary shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search indicators..."
              className="w-full bg-bg-surface border border-border-subtle rounded-md pl-10 pr-4 py-2 text-[14px] text-text-primary focus:border-blue outline-none transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[14px] text-text-muted">
              No indicators found
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.category} className="mb-4">
                <div className="px-4 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  {group.category}
                </div>
                {group.items.map(ind => {
                  const state = getIndicatorState(ind.id);
                  const isExpanded = expandedId === ind.id;

                  return (
                    <div key={ind.id} className="mb-0.5">
                      <button
                        onClick={() => toggleIndicator(ind.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-md text-left group transition-colors',
                          state.enabled ? 'bg-blue/5 hover:bg-blue/10' : 'hover:bg-bg-hover'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkmark */}
                          <div className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-all',
                            state.enabled
                              ? 'bg-blue border-blue'
                              : 'border-border-primary group-hover:border-text-muted'
                          )}>
                            {state.enabled && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div>
                            <div className={cn(
                              'text-[14px] font-medium transition-colors',
                              state.enabled ? 'text-blue' : 'text-text-primary group-hover:text-text-primary'
                            )}>
                              {ind.name}
                            </div>
                            <div className="text-[11px] text-text-muted mt-0.5">{ind.category}</div>
                          </div>
                        </div>

                        {/* Settings toggle */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : ind.id);
                          }}
                          className={cn(
                            'p-1 rounded transition-colors ml-2 text-text-muted hover:text-text-primary',
                            isExpanded && 'bg-bg-surface'
                          )}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </button>

                      {/* Settings panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden px-2"
                          >
                            <IndicatorSettingsPanel
                              indicator={state}
                              onUpdate={settings => updateIndicatorSettings(ind.id, settings)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-primary shrink-0 flex items-center justify-between">
          <span className="text-[12px] text-text-muted">
            {indicators.filter(i => i.enabled).length} active indicator{indicators.filter(i => i.enabled).length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue text-white text-[13px] font-medium rounded hover:bg-blue/90 transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
