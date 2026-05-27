import { useChart } from '@/store/useChart';
import { useIndicatorStore } from '@/store/useIndicatorStore';
import { motion } from 'framer-motion';
import { LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

function StatRow({ label, value, colorClass = "text-text-primary", flash = false }: { label: string, value: string | number | undefined, colorClass?: string, flash?: boolean }) {
  const [flashColor, setFlashColor] = useState('transparent');
  const [prev, setPrev] = useState(value);

  useEffect(() => {
    if (value !== prev && typeof value === 'number' && typeof prev === 'number') {
      setFlashColor(value > prev ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)');
      const t = setTimeout(() => setFlashColor('transparent'), 300);
      setPrev(value);
      return () => clearTimeout(t);
    }
    setPrev(value);
  }, [value, prev]);

  return (
    <div className="flex items-center justify-between py-1.5 px-3 hover:bg-bg-hover group transition-colors">
      <span className="text-[12px] text-text-muted font-medium">{label}</span>
      <motion.span 
        animate={{ backgroundColor: flash ? flashColor : 'transparent' }}
        className={cn("text-[13px] font-mono px-1 rounded transition-colors", colorClass)}
      >
        {value === undefined ? '—' : typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
      </motion.span>
    </div>
  );
}

export function DataWindowPanel() {
  const symbol = useChart(s => s.symbol);
  const cursorData = useChart(s => s.cursorData);
  const { indicators } = useIndicatorStore();
  const activeIndicators = new Set(indicators.filter(i => i.enabled).map(i => i.id));

  // Mock fundamental data
  const fundamentals = {
    marketCap: '$2.8T',
    float: '15.3B',
    beta: 1.12,
    atr: 2.45
  };

  const isUp = (cursorData?.close || 0) >= (cursorData?.open || 0);

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary overflow-y-auto">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border-primary sticky top-0 bg-bg-base z-10">
        <LineChart className="w-4 h-4 text-blue" />
        <h2 className="text-[14px] font-bold tracking-tight">Data Window</h2>
      </div>

      <div className="p-3 border-b border-border-primary bg-bg-surface/30">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[16px]">{symbol}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue/10 text-blue font-medium">EQUITY</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Market Open</span>
        </div>
      </div>

      <div className="py-1 border-b border-border-primary">
        <div className="px-3 py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">OHLCV</div>
        <StatRow label="Open" value={cursorData?.open} flash />
        <StatRow label="High" value={cursorData?.high} flash />
        <StatRow label="Low" value={cursorData?.low} flash />
        <StatRow label="Close" value={cursorData?.close} colorClass={isUp ? 'text-green-500' : 'text-red-500'} flash />
        <StatRow label="Volume" value={cursorData?.volume} />
      </div>

      <div className="py-1 border-b border-border-primary">
        <div className="px-3 py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">Indicators</div>
        {activeIndicators.has('VWAP') && <StatRow label="VWAP" value={cursorData?.vwap} colorClass="text-[#FF6D00]" />}
        {activeIndicators.has('EMA9') && <StatRow label="EMA (9)" value={cursorData?.ema9} colorClass="text-[#FF9800]" />}
        {activeIndicators.has('EMA21') && <StatRow label="EMA (21)" value={cursorData?.ema21} colorClass="text-[#E91E63]" />}
        {activeIndicators.has('EMA50') && <StatRow label="EMA (50)" value={cursorData?.ema50} colorClass="text-[#2196F3]" />}
        {activeIndicators.has('BB') && (
          <>
            <StatRow label="BB Upper" value={cursorData?.bbUpper} colorClass="text-[#9575CD]" />
            <StatRow label="BB Mid" value={cursorData?.bbMid} colorClass="text-[#9575CD]" />
            <StatRow label="BB Lower" value={cursorData?.bbLower} colorClass="text-[#9575CD]" />
          </>
        )}
      </div>

      <div className="py-1">
        <div className="px-3 py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">Fundamentals</div>
        <StatRow label="Market Cap" value={fundamentals.marketCap} />
        <StatRow label="Float" value={fundamentals.float} />
        <StatRow label="Beta" value={fundamentals.beta} />
        <StatRow label="ATR" value={fundamentals.atr} />
      </div>
    </div>
  );
}
