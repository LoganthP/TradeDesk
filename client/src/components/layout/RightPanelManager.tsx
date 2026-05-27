import { useUIStore } from '@/store/useUIStore';
import { WatchlistPanel } from '@/components/watchlist/WatchlistPanel';
import { DataWindowPanel } from '@/components/panels/DataWindowPanel';
import { ObjectTreePanel } from '@/components/panels/ObjectTreePanel';
import { CalendarPanel } from '@/components/panels/CalendarPanel';
import { NewsPanel } from '@/components/panels/NewsPanel';
import { TradeHistoryPanel } from '@/components/panels/TradeHistoryPanel';
import { AlertsPanel } from '@/components/panels/AlertsPanel';
import { AIAssistantPanel } from '@/components/panels/AIAssistantPanel';
import { TradingPanel } from '@/components/panels/TradingPanel';

export function RightPanelManager() {
  const { rightPanelActive } = useUIStore();

  if (!rightPanelActive) return null;

  switch (rightPanelActive) {
    case 'watchlist':
      return <WatchlistPanel />;
    case 'data-window':
      return <DataWindowPanel />;
    case 'object-tree':
      return <ObjectTreePanel />;
    case 'calendar':
      return <CalendarPanel />;
    case 'news':
      return <NewsPanel />;
    case 'history':
      return <TradeHistoryPanel />;
    case 'alerts':
      return <AlertsPanel />;
    case 'notes':
      return <AIAssistantPanel />;
    case 'trading':
      return <TradingPanel />;
    default:
      return null;
  }
}
