import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { LeftToolbar } from './LeftToolbar';
import { RightIconRail } from './RightIconRail';
import { BottomBar } from './BottomBar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useOrderFills } from '@/hooks/useOrderFills';
import { ToastManager } from '@/components/ui/ToastManager';
import { useSettings } from '@/store/useSettings';
import { useMockMarket } from '@/hooks/useMockMarket';

export function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const { theme } = useSettings();

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Activate order fill checking globally
  useOrderFills();
  
  // Activate mock market engine globally
  useMockMarket();

  return (
    <div className="app-shell">
      <Topbar className="grid-topbar" />
      
      {isDashboard ? (
        <>
          <LeftToolbar className="grid-left-toolbar" />
          <RightIconRail className="grid-right-rail" />
          <BottomBar className="grid-bottom-bar" />
        </>
      ) : null}

      {/* Main Content Area */}
      {isDashboard ? (
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      ) : (
        <div className="col-start-1 col-end-5 row-start-2 row-end-4 overflow-y-auto bg-bg-base relative">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      )}

      <ToastManager />
    </div>
  );
}
