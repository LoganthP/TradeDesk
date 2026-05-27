import { useEffect, useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  time: Date;
  country: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  actual?: string;
  forecast: string;
  previous: string;
}

const MOCK_EVENTS: Event[] = [
  { id: '1', time: new Date(Date.now() + 1000 * 60 * 45), country: '🇺🇸', title: 'Fed Chair Powell Speaks', impact: 'High', forecast: '-', previous: '-' },
  { id: '2', time: new Date(Date.now() + 1000 * 60 * 120), country: '🇺🇸', title: 'Core CPI (MoM)', impact: 'High', forecast: '0.3%', previous: '0.4%' },
  { id: '3', time: new Date(Date.now() + 1000 * 60 * 60 * 4), country: '🇪🇺', title: 'ECB Interest Rate Decision', impact: 'High', forecast: '4.50%', previous: '4.50%' },
  { id: '4', time: new Date(Date.now() + 1000 * 60 * 60 * 24), country: '🇬🇧', title: 'GDP (YoY)', impact: 'Medium', forecast: '0.2%', previous: '0.1%' },
  { id: '5', time: new Date(Date.now() - 1000 * 60 * 30), country: '🇯🇵', title: 'BoJ Press Conference', impact: 'High', actual: 'Done', forecast: '-', previous: '-' },
];

function formatTimeLeft(date: Date, now: number) {
  const diff = date.getTime() - now;
  if (diff < 0) return 'Passed';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${secs}s`;
}

export function CalendarPanel() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-primary sticky top-0 bg-bg-base z-10">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue" />
          <h2 className="text-[14px] font-bold tracking-tight">Economic Calendar</h2>
        </div>
      </div>

      <div className="flex flex-col gap-px bg-border-primary">
        {MOCK_EVENTS.map((ev) => {
          const isPassed = ev.time.getTime() < now;
          return (
            <motion.div 
              key={ev.id} 
              layout
              className={`p-3 bg-bg-base hover:bg-bg-hover transition-colors ${isPassed ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">{ev.country}</span>
                  <span className="text-[12px] font-mono text-text-muted">
                    {ev.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-blue w-16 text-right">
                    {formatTimeLeft(ev.time, now)}
                  </span>
                </div>
              </div>

              <div className="text-[13px] font-bold mb-2 leading-tight pr-4">
                {ev.title}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-text-muted">
                <div className="flex items-center gap-1">
                  <AlertCircle className={`w-3 h-3 ${ev.impact === 'High' ? 'text-red-500' : 'text-yellow-500'}`} />
                  {ev.impact}
                </div>
                <div className="flex items-center gap-2">
                  <span>Act: <span className="font-mono text-text-primary">{ev.actual || '-'}</span></span>
                  <span>Est: <span className="font-mono text-text-primary">{ev.forecast}</span></span>
                  <span>Prev: <span className="font-mono text-text-primary">{ev.previous}</span></span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
