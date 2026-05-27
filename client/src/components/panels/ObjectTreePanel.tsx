import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Eye, EyeOff, Trash2, GripVertical, Settings2, Lock, Unlock, Copy, ArrowUp } from 'lucide-react';
import { useChart } from '@/store/useChart';
import { useIndicatorStore } from '@/store/useIndicatorStore';
import { cn } from '@/lib/utils';
import { IndicatorsModal } from '@/components/chart/IndicatorsModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TreeItemProps {
  id: string;
  title: string;
  type: string;
  isLocked?: boolean;
  isHidden?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onToggleHide: () => void;
  onToggleLock: () => void;
  onSettings: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onMoveToTop?: () => void;
}

function SortableTreeItem(props: TreeItemProps) {
  const {
    id, title, type, isLocked, isHidden, isSelected,
    onSelect, onToggleHide, onToggleLock, onSettings, onDelete, onDuplicate, onMoveToTop
  } = props;
  
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={onSelect}
        onDoubleClick={onSettings}
        onContextMenu={handleContextMenu}
        className={cn(
          "group flex items-center justify-between py-1.5 px-2 rounded transition-all text-[13px] border cursor-default select-none mb-1",
          isSelected 
            ? "bg-blue/10 border-blue/30" 
            : "border-transparent hover:bg-bg-hover hover:border-border-primary",
          isDragging ? "shadow-lg bg-bg-surface opacity-90 scale-105" : "",
          isLocked ? "opacity-75" : ""
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div 
            {...attributes} 
            {...listeners}
            className={cn(
              "w-4 h-4 flex items-center justify-center shrink-0",
              isLocked ? "cursor-not-allowed opacity-30" : "cursor-grab hover:text-text-primary text-text-muted transition-colors opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => { e.stopPropagation(); }}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <span className={cn(
            "truncate",
            isHidden ? 'opacity-50 line-through' : ''
          )}>
            {title}
          </span>
          <span className="text-[10px] text-text-muted px-1.5 rounded bg-bg-surface shrink-0 hidden sm:inline-block">{type}</span>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isSelected ? 1 : 0 }}
          whileHover={{ opacity: 1 }}
          className={cn(
            "flex items-center gap-1 shrink-0 transition-opacity",
            "group-hover:opacity-100"
          )}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
            className={cn("p-1 rounded hover:bg-bg-surface transition-colors", isLocked ? "text-blue" : "text-text-muted hover:text-text-primary")}
            title={isLocked ? "Unlock" : "Lock"}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleHide(); }}
            className={cn("p-1 rounded hover:bg-bg-surface transition-colors", isHidden ? "text-text-muted" : "text-text-primary")}
            title={isHidden ? "Show" : "Hide"}
          >
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onSettings(); }}
            className="p-1 rounded hover:bg-bg-surface text-text-muted hover:text-text-primary transition-colors"
            title="Settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          
          {!isLocked && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 hover:bg-red/20 rounded text-text-muted hover:text-red transition-colors"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {showContextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} onContextMenu={(e) => { e.preventDefault(); setShowContextMenu(false); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 min-w-40 bg-bg-surface border border-border-primary rounded-lg shadow-xl py-1"
              style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted border-b border-border-primary/50 mb-1 truncate">{title}</div>
              
              <button 
                onClick={() => { onSettings(); setShowContextMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-bg-hover text-text-primary flex items-center gap-2"
              >
                <Settings2 className="w-3.5 h-3.5 text-text-muted" /> Settings
              </button>
              
              <button 
                onClick={() => { onToggleHide(); setShowContextMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-bg-hover text-text-primary flex items-center gap-2"
              >
                {isHidden ? <Eye className="w-3.5 h-3.5 text-text-muted" /> : <EyeOff className="w-3.5 h-3.5 text-text-muted" />} 
                {isHidden ? "Show" : "Hide"}
              </button>
              
              <button 
                onClick={() => { onToggleLock(); setShowContextMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-bg-hover text-text-primary flex items-center gap-2"
              >
                {isLocked ? <Unlock className="w-3.5 h-3.5 text-text-muted" /> : <Lock className="w-3.5 h-3.5 text-text-muted" />} 
                {isLocked ? "Unlock" : "Lock"}
              </button>
              
              {onDuplicate && (
                <button 
                  onClick={() => { onDuplicate(); setShowContextMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-bg-hover text-text-primary flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-text-muted" /> Duplicate
                </button>
              )}
              
              {onMoveToTop && !isLocked && (
                <button 
                  onClick={() => { onMoveToTop(); setShowContextMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-bg-hover text-text-primary flex items-center gap-2"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-text-muted" /> Move to Top
                </button>
              )}
              
              {!isLocked && (
                <>
                  <div className="h-px bg-border-primary/50 my-1"></div>
                  <button 
                    onClick={() => { onDelete(); setShowContextMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-red/10 text-red flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function ObjectTreePanel() {
  const {
    drawingObjects,
    setDrawingObjects,
    updateDrawingObject,
    removeDrawingObject,
    reorderDrawingObjects,
  } = useChart();
  const { 
    indicators, 
    toggleIndicator, 
    setIndicatorVisibility, 
    setIndicatorLock, 
    reorderIndicators 
  } = useIndicatorStore();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsModalId, setSettingsModalId] = useState<string | null>(null);
  
  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeIndicators = useMemo(() => indicators.filter(i => i.enabled), [indicators]);

  const handleIndicatorDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = indicators.findIndex((i) => i.id === active.id);
      const newIndex = indicators.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderIndicators(oldIndex, newIndex);
      }
    }
  };

  const handleDrawingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = drawingObjects.findIndex((d) => d.id === active.id);
      const newIndex = drawingObjects.findIndex((d) => d.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderDrawingObjects(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-primary sticky top-0 bg-bg-base z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue" />
          <h2 className="text-[14px] font-bold tracking-tight">Object Tree</h2>
        </div>
      </div>

      <div className="p-2 flex flex-col gap-4">
        {/* Indicators Section */}
        <div>
          <div className="px-2 py-1 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Indicators</div>
          {activeIndicators.length === 0 ? (
            <div className="px-2 py-2 text-[12px] text-text-muted italic">No active indicators</div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleIndicatorDragEnd}
            >
              <SortableContext 
                items={activeIndicators.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  <AnimatePresence>
                    {activeIndicators.map(ind => (
                      <SortableTreeItem
                        key={`indicator-${ind.id}`}
                        id={ind.id}
                        title={ind.name}
                        type="Indicator"
                        isLocked={ind.locked}
                        isHidden={ind.hidden}
                        isSelected={selectedId === ind.id}
                        onSelect={() => setSelectedId(ind.id)}
                        onToggleHide={() => setIndicatorVisibility(ind.id, !ind.hidden)}
                        onToggleLock={() => setIndicatorLock(ind.id, !ind.locked)}
                        onSettings={() => setSettingsModalId(ind.id)}
                        onDelete={() => toggleIndicator(ind.id)}
                        onMoveToTop={() => {
                          const idx = indicators.findIndex(i => i.id === ind.id);
                          if (idx > 0) reorderIndicators(idx, 0);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Drawings Section */}
        <div>
          <div className="px-2 py-1 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Drawings</div>
          {drawingObjects.length === 0 ? (
            <div className="px-2 py-2 text-[12px] text-text-muted italic">No drawings on chart</div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDrawingDragEnd}
            >
              <SortableContext 
                items={drawingObjects.map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  <AnimatePresence>
                    {drawingObjects.map(obj => (
                      <SortableTreeItem 
                        key={`drawing-${obj.id}`} 
                        id={obj.id}
                        title={obj.id} 
                        type="Drawing" 
                        isLocked={obj.locked}
                        isHidden={obj.hidden}
                        isSelected={selectedId === obj.id}
                        onSelect={() => setSelectedId(obj.id)}
                        onToggleHide={() => {
                          updateDrawingObject(obj.id, { hidden: !obj.hidden });
                          window.dispatchEvent(new CustomEvent('toggle-drawing', { detail: obj.id }));
                        }}
                        onToggleLock={() => updateDrawingObject(obj.id, { locked: !obj.locked })}
                        onSettings={() => {
                          setSelectedId(obj.id);
                          window.dispatchEvent(new CustomEvent('edit-drawing', { detail: obj.id }));
                        }}
                        onDelete={() => {
                          removeDrawingObject(obj.id);
                          window.dispatchEvent(new CustomEvent('delete-drawing', { detail: obj.id }));
                        }}
                        onDuplicate={() => {
                          const duplicate = {
                            ...obj,
                            id: `${obj.id}-copy-${Date.now()}`,
                            locked: false,
                            hidden: false,
                          };
                          setDrawingObjects([...drawingObjects, duplicate]);
                        }}
                        onMoveToTop={() => {
                          const idx = drawingObjects.findIndex(d => d.id === obj.id);
                          if (idx > 0) reorderDrawingObjects(idx, 0);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {settingsModalId && (
        <IndicatorsModal 
          onClose={() => setSettingsModalId(null)}
          initialExpandedId={settingsModalId}
        />
      )}
    </div>
  );
}
