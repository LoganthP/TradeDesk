import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useChart } from '@/store/useChart';
import type { FinancialTab } from '@/store/useFinancialsStore';
import { useFinancialsStore } from '@/store/useFinancialsStore';
import { generateFinancialData } from '@/lib/financialsData';
import { FinancialsTable } from './FinancialsTable';
import { FinancialsCharts } from './FinancialsCharts';
import { cn } from '@/lib/utils';
import { modalScale } from '@/lib/animationVariants';

interface FinancialsModalProps {
  onClose: () => void;
}

const TABS: { id: FinancialTab; label: string }[] = [
  { id: 'income', label: 'Income Statement' },
  { id: 'balance', label: 'Balance Sheet' },
  { id: 'cashflow', label: 'Cash Flow' }
];

export function FinancialsModal({ onClose }: FinancialsModalProps) {
  const { symbol } = useChart();
  const { activeTab, activePeriod, searchQuery, setTab, setPeriod, setSearch } = useFinancialsStore();

  const data = useMemo(() => {
    return generateFinancialData(symbol, activeTab, activePeriod);
  }, [symbol, activeTab, activePeriod]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
      <motion.div 
        variants={modalScale}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-5xl bg-bg-base border border-border-primary rounded-xl shadow-2xl flex flex-col overflow-hidden h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-surface flex-shrink-0 z-20 relative">
          <div className="flex items-center gap-4">
            <h2 className="text-[18px] font-bold text-text-primary tracking-tight">Financials</h2>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold font-mono text-text-primary">{symbol}</span>
              <span className="text-[11px] text-text-muted">NASDAQ</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-border-primary bg-bg-surface flex-shrink-0 z-20 relative">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-colors duration-150 relative",
                activeTab === tab.id 
                  ? "border-blue text-blue" 
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-border-focus"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-blue"
                />
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-primary flex-shrink-0 bg-bg-base z-20 relative shadow-sm">
          <div className="flex items-center bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 w-64 focus-within:border-border-focus transition-colors">
            <Search className="w-3.5 h-3.5 text-text-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search statements..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] text-text-primary w-full"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPeriod('annual')}
              className={cn(
                "tv-button px-3 py-1.5 text-[12px] font-medium border transition-colors",
                activePeriod === 'annual' 
                  ? "bg-blue/10 border-blue/30 text-blue" 
                  : "bg-bg-elevated border-border-subtle text-text-muted hover:text-text-primary"
              )}
            >
              Annual
            </button>
            <button 
              onClick={() => setPeriod('quarterly')}
              className={cn(
                "tv-button px-3 py-1.5 text-[12px] font-medium border transition-colors",
                activePeriod === 'quarterly' 
                  ? "bg-blue/10 border-blue/30 text-blue" 
                  : "bg-bg-elevated border-border-subtle text-text-muted hover:text-text-primary"
              )}
            >
              Quarterly
            </button>
          </div>
        </div>

        {/* Content Area - Split into Chart and Table */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-bg-base">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activePeriod}-${symbol}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="h-[240px] shrink-0 border-b border-border-primary p-4 bg-bg-surface/50">
                <FinancialsCharts data={data} tab={activeTab} />
              </div>
              <div className="flex-1 overflow-hidden relative">
                <FinancialsTable data={data} searchQuery={searchQuery} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
