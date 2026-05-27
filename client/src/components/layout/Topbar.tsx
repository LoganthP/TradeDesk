import { Search, ChevronDown, Bell, RotateCcw, Undo2, Redo2, Maximize, Camera, DollarSign, Settings, Check, Share2 } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useMultiChartStore, type WorkspaceType } from '@/store/useMultiChartStore';
import { useIndicatorStore } from '@/store/useIndicatorStore';
import { useToast } from '@/store/useToast';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dropdownSlide } from '@/lib/animationVariants';
import { FinancialsModal } from '@/components/chart/FinancialsModal';
import { IndicatorsModal } from '@/components/chart/IndicatorsModal';
import { TIMEFRAMES } from '@/lib/constants';
import { normalizeTimeframe } from '@/api/prices';

export function Topbar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const { 
    activeWorkspace, 
    setWorkspace, 
    panels, 
    activePanelId, 
    updatePanel,
    resetLayout
  } = useMultiChartStore();
  
  const activePanel = panels.find(p => p.id === activePanelId) || panels.find(p => p.type === 'chart') || panels[0];
  const symbol = activePanel.symbol;
  const activeTimeframe = normalizeTimeframe(activePanel.timeframe);
  const setTimeframe = (tf: string) => updatePanel(activePanel.id, { timeframe: tf });
  const setSymbol = (sym: string) => updatePanel(activePanel.id, { symbol: sym });
  
  const { indicators } = useIndicatorStore();
  const activeCount = indicators.filter(i => i.enabled).length;

  const [openDropdown, setOpenDropdown] = useState<'timeframe' | 'workspace' | 'notifications' | null>(null);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdown(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleDropdown = (e: React.MouseEvent, type: 'timeframe' | 'workspace' | 'notifications') => {
    e.stopPropagation();
    setOpenDropdown(prev => prev === type ? null : type);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        addToast({ title: 'Error', message: `Error attempting to enable fullscreen mode: ${err.message}`, type: 'error' });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const takeScreenshot = () => {
    addToast({ title: 'Screenshot Captured', message: 'Chart image saved to clipboard.', type: 'success' });
  };

  const shareChart = async () => {
    const shareData = {
      title: 'TradeDesk chart',
      text: 'Check out this chart layout on TradeDesk.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        addToast({ title: 'Shared', message: 'Chart link shared successfully.', type: 'success' });
      } catch (error) {
        addToast({ title: 'Share canceled', message: 'Share was canceled or blocked.', type: 'warning' });
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast({ title: 'Link copied', message: 'Chart URL copied to clipboard.', type: 'success' });
    } catch (error) {
      addToast({ title: 'Share failed', message: 'Unable to copy the URL.', type: 'error' });
    }
  };

  const undoAction = () => addToast({ title: 'Undo', message: 'Last action undone.', type: 'info' });
  const redoAction = () => addToast({ title: 'Redo', message: 'Last action redone.', type: 'info' });
  const resetChart = () => {
    resetLayout();
    addToast({ title: 'Workspace Reset', message: 'Layout and panels have been reset.', type: 'info' });
  };

  return (
    <header className={cn("flex items-center justify-between px-4 border-b border-border-primary bg-bg-base relative z-40", className)}>
      {/* Left */}
      <div className="flex items-center h-full gap-2 md:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 cursor-pointer mr-1 md:mr-2 shrink-0" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6">
            <path d="M4 4H20V7H13.5V20H10.5V7H4V4Z" fill="var(--blue)"/>
          </svg>
          <span className="font-bold text-text-primary tracking-tight hidden sm:inline text-[13px] md:text-[14px]">TradeDesk</span>
        </div>

        <nav className="hidden md:flex items-center gap-1 mr-2 shrink-0">
          <NavLink to="/dashboard" className={({ isActive }) => cn("px-2 py-1 text-[12px] md:text-[13px] font-medium rounded transition-colors", isActive ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover")}>Chart</NavLink>
          <NavLink to="/markets" className={({ isActive }) => cn("px-2 py-1 text-[12px] md:text-[13px] font-medium rounded transition-colors", isActive ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover")}>Markets</NavLink>
          <NavLink to="/portfolio" className={({ isActive }) => cn("px-2 py-1 text-[12px] md:text-[13px] font-medium rounded transition-colors", isActive ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover")}>Portfolio</NavLink>
          <NavLink to="/analytics" className={({ isActive }) => cn("px-2 py-1 text-[12px] md:text-[13px] font-medium rounded transition-colors", isActive ? "text-blue bg-blue/10" : "text-text-muted hover:text-text-primary hover:bg-bg-hover")}>Analytics</NavLink>
        </nav>
        
        <div className="flex items-center bg-bg-elevated border border-border-subtle rounded px-1.5 py-0.5 focus-within:border-border-focus transition-colors w-24 md:w-32 shrink-0">
          <Search className="w-3 h-3 text-text-muted mr-1.5 md:mr-2" />
          <input 
            type="text" 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.trim().toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  setSymbol(target.value.trim().toUpperCase());
                  addToast({ title: 'Symbol Changed', message: `Loading chart for ${target.value.toUpperCase()}`, type: 'success' });
                  target.blur();
                }
              }
            }}
            className="bg-transparent border-none outline-none text-[11px] md:text-[13px] font-mono text-text-primary w-full uppercase"
            placeholder="Search"
          />
        </div>

        <div className="flex items-center gap-1 relative shrink-0">
          <button onClick={(e) => handleDropdown(e, 'timeframe')} className="tv-button px-1.5 py-0.5 text-[11px] md:text-[13px] font-semibold text-text-primary">
            {activeTimeframe} <ChevronDown className="w-3 h-3 ml-0.5 md:ml-1 text-text-muted" />
          </button>
          
          <AnimatePresence>
            {openDropdown === 'timeframe' && (
              <motion.div 
                variants={dropdownSlide as any} initial="hidden" animate="visible" exit="exit"
                className="absolute top-full left-0 mt-1 w-32 bg-bg-elevated border border-border-primary rounded shadow-xl z-50 py-1"
                onClick={e => e.stopPropagation()}
              >
                {TIMEFRAMES.map(({ value, label }) => (
                  <button 
                    key={value} 
                    onClick={() => { setTimeframe(value); setOpenDropdown(null); }}
                    className={cn("w-full text-left px-4 py-1.5 text-[13px] hover:bg-bg-hover text-text-primary", activeTimeframe === value && "text-blue")}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-1 md:gap-2 h-full relative shrink-0">
        <button onClick={() => setShowIndicators(true)} className="tv-button px-2 py-1 text-[11px] md:text-[13px] text-text-primary font-medium gap-1.5 border border-border-subtle hover:border-border-focus shrink-0">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor" className="shrink-0"><path d="M3 3h12v12H3V3zm2 2v8h8V5H5z"/></svg>
          <span className="hidden sm:inline">Indicators</span> {activeCount > 0 && <span className="bg-blue/20 text-blue px-1 py-0.5 rounded ml-0.5 text-[9px]">{activeCount}</span>}
        </button>

        <div className="relative shrink-0">
          <button onClick={(e) => handleDropdown(e, 'workspace')} className="tv-button p-1 md:p-1.5 text-text-primary flex items-center gap-1 bg-bg-elevated/50 border border-border-primary rounded" title="Workspace">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="12" height="12" rx="1"/>
              <path d="M9 3v12" />
              <path d="M3 9h12" />
            </svg>
            <span className="text-[10px] font-bold uppercase text-text-secondary hidden md:inline ml-1 pr-1">{activeWorkspace}</span>
          </button>
          <AnimatePresence>
            {openDropdown === 'workspace' && (
              <motion.div 
                variants={dropdownSlide as any} initial="hidden" animate="visible" exit="exit"
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-bg-elevated border border-border-primary rounded-lg shadow-2xl z-50 overflow-hidden py-2"
                onClick={e => e.stopPropagation()}
              >
                {/* Workspace presets */}
                <div className="px-2 pt-1">
                  <div className="px-2 pb-2 mb-1 border-b border-border-primary/40">
                    <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider">Trading Workspaces</span>
                    <p className="text-[10px] text-text-secondary mt-0.5 leading-tight">Completely specialized environments</p>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {[
                      { id: 'standard', label: 'Standard Terminal', desc: 'Classic multi-chart layout with sync options.', icon: '■' },
                      { id: 'scalping', label: 'Scalping Station', desc: 'Execution chart, DOM ladder, and trade tape.', icon: '⚡' },
                      { id: 'crypto', label: 'Crypto Matrix', desc: 'Live grid of major tokens with real-time stats.', icon: '🪙' },
                    ].map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => { 
                          setWorkspace(p.id as WorkspaceType); 
                          setOpenDropdown(null);
                          addToast({ 
                            title: `${p.label} Loaded`, 
                            message: `Switched to dedicated institutional workspace.`, 
                            type: 'success' 
                          });
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded flex gap-3 items-center transition-colors group",
                          activeWorkspace === p.id ? "bg-blue/10 border border-blue/20" : "hover:bg-bg-hover border border-transparent"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner", activeWorkspace === p.id ? "bg-blue/20" : "bg-bg-surface")}>
                          <span className="text-[14px] filter drop-shadow">{p.icon}</span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={cn("text-[13px] font-semibold transition-colors leading-tight", activeWorkspace === p.id ? "text-blue" : "text-text-primary group-hover:text-blue")}>{p.label}</span>
                          <span className="text-[10px] text-text-muted leading-tight mt-0.5 pr-1 line-clamp-2">{p.desc}</span>
                        </div>
                        {activeWorkspace === p.id && <Check className="w-4 h-4 text-blue shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => setShowFinancials(true)} className="tv-button p-1 md:p-1.5 text-text-muted hover:text-text-primary shrink-0" title="Financials">
          <DollarSign className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border-primary mx-0.5 md:mx-1 shrink-0" />
        
        <div className="relative shrink-0">
          <button onClick={(e) => handleDropdown(e, 'notifications')} className="tv-button p-1 md:p-1.5 text-text-muted hover:text-text-primary relative" title="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red rounded-full shadow-[0_0_4px_#ef5350]" />
          </button>
          <AnimatePresence>
            {openDropdown === 'notifications' && (
              <motion.div 
                variants={dropdownSlide as any} initial="hidden" animate="visible" exit="exit"
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-bg-elevated border border-border-primary rounded shadow-xl z-50 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 py-2 border-b border-border-primary bg-bg-surface flex justify-between items-center">
                  <span className="text-[13px] font-bold text-text-primary">Notifications</span>
                  <span className="text-[11px] text-blue cursor-pointer">Mark all read</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border-primary hover:bg-bg-hover cursor-pointer transition-colors">
                    <p className="text-[13px] text-text-primary font-medium">Price Alert Triggered</p>
                    <p className="text-[12px] text-text-muted">AAPL crossed above 175.00</p>
                    <p className="text-[10px] text-text-secondary mt-1">2 mins ago</p>
                  </div>
                  <div className="px-4 py-3 border-b border-border-primary hover:bg-bg-hover cursor-pointer transition-colors">
                    <p className="text-[13px] text-text-primary font-medium">Order Executed</p>
                    <p className="text-[12px] text-text-muted">Bought 10 TSLA @ 180.50</p>
                    <p className="text-[10px] text-text-secondary mt-1">1 hour ago</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden lg:flex items-center gap-1 shrink-0">
          <button onClick={resetChart} className="tv-button p-1 text-text-muted hover:text-text-primary" title="Reset Chart"><RotateCcw className="w-3.5 h-3.5" /></button>
          <button onClick={undoAction} className="tv-button p-1 text-text-muted hover:text-text-primary" title="Undo"><Undo2 className="w-3.5 h-3.5" /></button>
          <button onClick={redoAction} className="tv-button p-1 text-text-muted hover:text-text-primary" title="Redo"><Redo2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3 h-full shrink-0">
        <div className="hidden md:flex items-center gap-1.5">
          <button className="tv-button p-1 md:p-1.5 text-text-muted hover:text-text-primary" onClick={takeScreenshot} title="Take a snapshot"><Camera className="w-4 h-4" /></button>
          <button className="tv-button p-1 md:p-1.5 text-text-muted hover:text-text-primary" onClick={toggleFullscreen} title="Fullscreen mode"><Maximize className="w-4 h-4" /></button>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 ml-1">
          <button onClick={shareChart} className="tv-button p-1 md:p-1.5 text-text-muted hover:text-blue" title="Share chart">
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button onClick={() => navigate('/settings')} className="tv-button p-1 md:p-1.5 text-text-muted hover:text-text-primary" title="Settings">
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showFinancials && <FinancialsModal onClose={() => setShowFinancials(false)} />}
        {showIndicators && <IndicatorsModal onClose={() => setShowIndicators(false)} />}
      </AnimatePresence>
    </header>
  );
}
