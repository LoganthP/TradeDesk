import { cn } from '@/lib/utils';
import { 
  FileText, LineChart, Layers, Calendar, 
  Newspaper, History, Bell, MessageSquare, Briefcase 
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

const rails = [
  { id: 'watchlist', icon: FileText, title: 'Watchlist & details' },
  { id: 'data-window', icon: LineChart, title: 'Data Window' },
  { id: 'object-tree', icon: Layers, title: 'Object Tree' },
  { id: 'calendar', icon: Calendar, title: 'Economic Calendar' },
  { id: 'news', icon: Newspaper, title: 'News' },
  { id: 'history', icon: History, title: 'Trade History' },
  { id: 'alerts', icon: Bell, title: 'Alerts' },
  { id: 'notes', icon: MessageSquare, title: 'Notes' },
  { id: 'trading', icon: Briefcase, title: 'Trading Panel' },
] as const;

export function RightIconRail({ className }: { className?: string }) {
  const { rightPanelActive, toggleRightPanel } = useUIStore();

  return (
    <aside className={cn("flex flex-col items-center border-l border-border-primary bg-bg-base py-2 gap-1 overflow-y-auto", className)}>
      {rails.map(rail => {
        const isActive = rightPanelActive === rail.id;
        return (
          <button 
            key={rail.id}
            onClick={() => toggleRightPanel(rail.id)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center tv-button",
              isActive ? "text-blue bg-blue/10 border-r-2 border-blue" : "text-text-muted hover:text-text-primary"
            )}
            title={rail.title}
          >
            <rail.icon className="w-5 h-5" strokeWidth={1.5} />
          </button>
        );
      })}
    </aside>
  );
}
