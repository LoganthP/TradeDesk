import { cn } from '@/lib/utils';
import { Crosshair, Ruler, Trash2, Minus, ArrowRight, ZoomIn } from 'lucide-react';
import { useChart } from '@/store/useChart';
import { useToast } from '@/store/useToast';

export function LeftToolbar({ className }: { className?: string }) {
  const { activeDrawingTool, setActiveDrawingTool } = useChart();
  const { addToast } = useToast();

  const handleClear = () => {
    setActiveDrawingTool(null);
    addToast({ title: 'Cleared', message: 'All drawings have been removed.', type: 'info' });
    // In a real app we'd dispatch an event to clear the drawings on the chart
    window.dispatchEvent(new CustomEvent('clear-drawings'));
  };

  return (
    <aside className={cn("flex flex-col items-center border-r border-border-primary bg-bg-base py-2 gap-1 overflow-y-auto", className)}>
      <div className="flex flex-col gap-1 w-full px-2">
        <button 
          onClick={() => setActiveDrawingTool(null)}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center tv-button transition-colors",
            activeDrawingTool === null ? "text-blue bg-blue/10 border-l-2 border-blue" : "text-text-muted hover:text-text-primary"
          )} 
          title="Crosshair"
        >
          <Crosshair className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="w-8 h-px bg-border-primary my-1" />

      <div className="flex flex-col gap-1 w-full px-2">
        <button 
          onClick={() => setActiveDrawingTool('trendline')}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center tv-button transition-colors",
            activeDrawingTool === 'trendline' ? "text-blue bg-blue/10 border-l-2 border-blue" : "text-text-muted hover:text-text-primary"
          )} 
          title="Trend Line"
        >
          <Minus className="w-5 h-5 rotate-45" strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => setActiveDrawingTool('hline')}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center tv-button transition-colors",
            activeDrawingTool === 'hline' ? "text-blue bg-blue/10 border-l-2 border-blue" : "text-text-muted hover:text-text-primary"
          )} 
          title="Horizontal Line"
        >
          <Minus className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => setActiveDrawingTool('arrow')}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center tv-button transition-colors",
            activeDrawingTool === 'arrow' ? "text-blue bg-blue/10 border-l-2 border-blue" : "text-text-muted hover:text-text-primary"
          )} 
          title="Arrow"
        >
          <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="w-8 h-px bg-border-primary my-1" />

      <div className="flex flex-col gap-1 w-full px-2">
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary tv-button" title="Measure">
          <Ruler className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary tv-button" title="Zoom In">
          <ZoomIn className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-1 w-full px-2 mt-auto pb-2">
        <button 
          onClick={handleClear}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-red tv-button transition-colors" 
          title="Remove Drawings"
        >
          <Trash2 className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
