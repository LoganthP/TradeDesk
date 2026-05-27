import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Search, LogOut, ChevronDown, Bell, Wallet, Settings } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { useChart } from '@/store/useChart';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { ALL_SYMBOLS, type SymbolInfo } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const setSymbol = useChart((s) => s.setSymbol);
  const navigate = useNavigate();
  const activePortfolio = usePortfolioStore((s) => s.activePortfolio);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SymbolInfo[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      setShowSearch(false);
    }
    if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
      setShowUserMenu(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length === 0) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const q = query.toUpperCase();
    const results = ALL_SYMBOLS.filter(
      (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q),
    ).slice(0, 8);
    setSearchResults(results);
    setShowSearch(true);
  };

  const selectSymbol = (symbol: string) => {
    setSymbol(symbol);
    setSearchQuery('');
    setShowSearch(false);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const holdingsValue = activePortfolio?.holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0) || 0;
  const totalValue = activePortfolio ? activePortfolio.balance + holdingsValue : 100000;
  const startingBalance = activePortfolio?.startingBalance ?? 100000;
  const returnsPercent = ((totalValue - startingBalance) / startingBalance) * 100;

  return (
    <header className="h-16 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6 gap-6 z-50 shrink-0">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded hover:bg-white/5 transition-colors text-text-secondary"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Symbol Search */}
        <div ref={searchRef} className="relative flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowSearch(true)}
              placeholder="Search symbol (e.g. BTCUSD, AAPL)..."
              className="w-full h-9 pl-9 pr-3 text-xs glass-input rounded"
            />
          </div>

          {/* Autocomplete dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 w-full bg-bg-secondary border border-border-primary rounded shadow-2xl z-50 overflow-hidden animate-scale-in">
              {searchResults.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => selectSymbol(s.symbol)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-accent/10 transition-colors border-b border-border-subtle/50 last:border-0"
                >
                  <div>
                    <span className="text-xs font-semibold text-text-primary font-mono">{s.symbol}</span>
                    <span className="ml-2 text-[11px] text-text-muted">{s.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-text-secondary">
                    ${s.basePrice.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Portfolio Metrics + Account Controls */}
      <div className="flex items-center gap-6">
        {/* Live balance and returns */}
        {activePortfolio && (
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Virtual Balance</span>
              <span className="font-mono text-sm font-bold text-accent">{formatCurrency(totalValue)}</span>
            </div>
            <div className="h-6 w-px bg-border-primary/50" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">All-Time Return</span>
              <span className={cn(
                'font-mono text-xs font-bold',
                returnsPercent >= 0 ? 'text-profit' : 'text-loss'
              )}>
                {returnsPercent >= 0 ? '+' : ''}{returnsPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        <div className="h-6 w-px bg-border-primary/50 hidden sm:block" />

        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <button className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded hover:bg-white/3">
            <Bell className="w-[18px] h-[18px]" />
          </button>
          <button className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded hover:bg-white/3">
            <Wallet className="w-[18px] h-[18px]" />
          </button>
          <button className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded hover:bg-white/3">
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* User avatar dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded hover:bg-white/3 transition-colors border border-border-primary/40"
          >
            <div className="w-8 h-8 rounded overflow-hidden border border-border-primary/80">
              <img
                alt="User headshot"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbYSG9mjIBv0wbu8UdHCe-4_5vtLmtjXFCSN8FDwQmliUUaUuwEU2yAfm4TRbuk8dCljRl-ZgNskgbMCgL1JkwCtmUTQvOHkxttyAzGrcXXslyb2hePH6kqZuxpckYQQCFt5SKPY_m1RRg9zD4Qiw_24kRotWgOsAXhWob7vDTPPgshQH9NhYZ5crOn9_0nnavOMeLD6QnNDiXxuntuEjX8D2Iqy0QbN0kw6xotFvEkoC5o1mXqreQIzHyGBsYzrhOPWsERDBJliA"
              />
            </div>
            <span className="hidden md:block text-xs font-semibold text-text-primary max-w-[100px] truncate">
              {user?.displayName || user?.email?.split('@')[0] || 'Trader'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border-primary rounded shadow-2xl z-50 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-border-subtle bg-bg-tertiary">
                <p className="text-xs font-bold text-text-primary truncate">
                  {user?.displayName || 'Trader'}
                </p>
                <p className="text-[10px] text-text-muted truncate font-mono mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-2 text-xs text-loss hover:bg-loss/10 transition-colors font-medium border-t border-border-subtle"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
