import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Star,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col',
          'w-[280px] bg-bg-tertiary border-r border-border-primary',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:static md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            {/* TradeDesk Monogram SVG */}
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <path d="M4 4H20V7H13.5V20H10.5V7H4V4Z" fill="#46f1c5"/>
            </svg>
            <div>
              <span className="font-display text-lg font-black tracking-tight text-accent">TradeDesk</span>
              <span className="block text-[10px] font-mono text-text-secondary tracking-widest uppercase">
                Pro Terminal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              tabIndex={0}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: '0 8px 8px 0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(0,212,170,0.12)' : 'transparent',
                borderLeft: `2px solid ${isActive ? '#00D4AA' : 'transparent'}`,
                color: isActive ? '#00D4AA' : 'rgba(255,255,255,0.55)',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle shrink-0 bg-bg-tertiary">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-profit animate-pulse-slow" />
            <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider">Markets Live</span>
          </div>
        </div>
      </aside>
    </>
  );
}
