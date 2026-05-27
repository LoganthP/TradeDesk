import { useState } from 'react';
import { Bell, Plus, Play, Pause, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useChart } from '@/store/useChart';
import { useToast } from '@/store/useToast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  symbol: string;
  condition: string;
  value: string;
  status: 'active' | 'paused' | 'triggered';
}

export function AlertsPanel() {
  const symbol = useChart(s => s.symbol);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', symbol: 'AAPL', condition: 'Crossing Up', value: '185.50', status: 'active' },
    { id: '2', symbol: 'MSFT', condition: 'Crossing Down', value: '410.00', status: 'paused' },
    { id: '3', symbol: 'TSLA', condition: 'Greater Than', value: '200.00', status: 'triggered' },
  ]);

  const toggleStatus = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'active' ? 'paused' : 'active';
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    useToast.getState().addToast({ title: 'Alert Deleted', message: 'Alert was removed successfully', type: 'success' });
  };

  const addMockAlert = () => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol,
      condition: 'Crossing',
      value: (100 + Math.random() * 50).toFixed(2),
      status: 'active'
    };
    setAlerts([newAlert, ...alerts]);
    useToast.getState().addToast({ title: 'Alert Created', message: `Alert added for ${symbol}`, type: 'success' });
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-primary sticky top-0 bg-bg-base z-10">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue" />
          <h2 className="text-[14px] font-bold tracking-tight">Alerts</h2>
        </div>
        <button 
          onClick={addMockAlert}
          className="p-1.5 hover:bg-bg-hover rounded text-text-primary transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col p-2 gap-2">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => (
            <motion.div 
              key={alert.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "p-3 rounded border border-border-primary flex flex-col gap-2 transition-colors",
                alert.status === 'active' ? 'bg-bg-surface' : 'bg-bg-base opacity-75'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold">{alert.symbol}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                    alert.status === 'active' ? "bg-green-500/20 text-green-500" :
                    alert.status === 'paused' ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-red-500/20 text-red-500"
                  )}>
                    {alert.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {alert.status !== 'triggered' && (
                    <button 
                      onClick={() => toggleStatus(alert.id)}
                      className="p-1.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-colors"
                    >
                      {alert.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button 
                    onClick={() => removeAlert(alert.id)}
                    className="p-1.5 hover:bg-red/20 rounded text-text-muted hover:text-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[13px] text-text-muted">
                {alert.condition.includes('Up') ? <TrendingUp className="w-4 h-4 text-green-500" /> : 
                 alert.condition.includes('Down') ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                 <Bell className="w-4 h-4 text-blue" />}
                <span>{alert.condition}</span>
                <span className="font-mono text-text-primary font-medium">{alert.value}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center text-center text-text-muted">
            <Bell className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-[13px]">No alerts configured</p>
          </div>
        )}
      </div>
    </div>
  );
}
