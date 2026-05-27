import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useChart } from '@/store/useChart';

const RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];

export function BottomBar({ className }: { className?: string }) {
  const {
    activeRange,
    isExtended,
    isLogScale,
    isPercentMode,
    isAutoScale,
    setRange,
    toggleExtended,
    toggleLogScale,
    togglePercentMode,
    toggleAutoScale,
  } = useChart();

  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        timeZoneName: 'short' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className={cn("flex items-center justify-between px-4 border-t border-border-primary bg-bg-base", className)}>
      <div className="flex items-center gap-1 h-full">
        {RANGES.map(range => (
          <button 
            key={range}
            onClick={() => setRange(range)}
            className={cn(
              "text-[11px] font-medium px-2 py-1 rounded transition-colors",
              activeRange === range
                ? "text-blue bg-blue/10"
                : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
            )}
          >
            {range}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-3 h-full">
        <span className="text-[11px] text-text-muted tabular-nums">{timeString} (UTC)</span>
        <div className="w-px h-3 bg-border-primary" />
        <button
          onClick={toggleExtended}
          className={cn(
            "text-[11px] font-medium px-2 py-1 rounded transition-colors",
            isExtended ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
          )}
        >
          ext
        </button>
        <div className="w-px h-3 bg-border-primary" />
        <button
          onClick={togglePercentMode}
          className={cn(
            "text-[11px] font-medium px-2 py-1 rounded transition-colors",
            isPercentMode ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
          )}
        >
          %
        </button>
        <div className="w-px h-3 bg-border-primary" />
        <button
          onClick={toggleLogScale}
          className={cn(
            "text-[11px] font-medium px-2 py-1 rounded transition-colors",
            isLogScale ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
          )}
        >
          log
        </button>
        <div className="w-px h-3 bg-border-primary" />
        <button
          onClick={toggleAutoScale}
          className={cn(
            "text-[11px] font-medium px-2 py-1 rounded transition-colors",
            isAutoScale ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
          )}
        >
          auto
        </button>
      </div>
    </footer>
  );
}
