import { useState, useRef, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { ChartContainer } from '@/components/chart/ChartContainer';
import { RightPanelManager } from '@/components/layout/RightPanelManager';
import { OrderBook } from '@/components/orders/OrderBook';
import { useUIStore } from '@/store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import { panelSlide } from '@/lib/animationVariants';

const MIN_RIGHT_PANEL_WIDTH = 260;
const MAX_RIGHT_PANEL_WIDTH = 520;

export function DashboardPage() {
  const { rightPanelActive } = useUIStore();
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(320);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startXRef.current - event.clientX;
      const newWidth = Math.min(MAX_RIGHT_PANEL_WIDTH, Math.max(MIN_RIGHT_PANEL_WIDTH, startWidthRef.current + delta));
      setRightPanelWidth(newWidth);
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startXRef.current = event.clientX;
    startWidthRef.current = rightPanelWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <>
      {/* Center Chart Area */}
      <div className="grid-chart-area flex flex-col relative bg-bg-void border-r border-border-primary overflow-hidden min-w-0">
        <div className="chart-wrapper flex-[1_1_0] min-w-0 min-h-0 relative">
          <ChartContainer />
        </div>
        
        {/* Order Book Drawer (Restored logic from previous fix) */}
        <div className="flex-shrink-0 z-10">
          <OrderBook />
        </div>
      </div>

      {/* Right Panel Drawer */}
      <AnimatePresence>
        {rightPanelActive && (
          <motion.div 
            className="grid-right-panel flex flex-col bg-bg-surface overflow-hidden z-30 relative"
            variants={panelSlide}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: rightPanelWidth }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 z-40 w-2 -ml-1 cursor-ew-resize"
              onPointerDown={startResize}
              role="presentation"
            />
            <RightPanelManager />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
