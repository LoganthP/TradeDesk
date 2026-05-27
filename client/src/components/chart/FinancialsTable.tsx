import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Download, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { FinancialMetric, FinancialStatement } from '@/lib/financialsData';
import { formatLargeNumber } from '@/lib/financialsData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialsTableProps {
  data: FinancialStatement;
  searchQuery: string;
}

// Sparkline component using an SVG path
function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  // Normalize values to 0-1
  const normalized = values.map(v => (v - min) / range);
  
  // Create SVG path
  const width = 60;
  const height = 24;
  const points = normalized.map((val, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (val * height);
    return `${x},${y}`;
  }).join(' L ');

  const isUp = values[values.length - 1] >= values[0];
  const colorClass = isUp ? 'stroke-profit' : 'stroke-loss';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={`M ${points}`}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorClass}
      />
    </svg>
  );
}

function MetricRow({ 
  item, 
  level = 0,
  expanded,
  onToggle
}: { 
  item: FinancialMetric, 
  level?: number,
  expanded: boolean,
  onToggle: (id: string) => void
}) {
  const hasChildren = item.isExpandable;
  const vals = [item.values.y3, item.values.y2, item.values.y1, item.values.y0];

  return (
    <tr className={cn(
      "hover:bg-bg-hover transition-colors border-b border-border-primary/30 group",
      level > 0 ? "bg-black/10" : ""
    )}>
      <td className="px-6 py-3 text-[13px] font-medium text-text-primary sticky left-0 bg-inherit min-w-[250px] z-10">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
          {hasChildren ? (
            <button 
              onClick={() => onToggle(item.id)}
              className="p-0.5 rounded hover:bg-bg-elevated text-text-muted transition-colors"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <div className="w-4.5" /> // Spacer for alignment
          )}
          <div className="flex flex-col">
            <span>{item.metric}</span>
            {item.explanation && (
              <span className="text-[10px] text-text-muted font-normal hidden group-hover:block absolute top-[100%] left-[24px] bg-bg-elevated border border-border-focus p-2 rounded shadow-xl z-50 max-w-[200px] whitespace-normal">
                {item.explanation}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-3 text-[13px] font-mono-numbers text-right text-text-primary">{formatLargeNumber(item.values.y0)}</td>
      <td className="px-6 py-3 text-[13px] font-mono-numbers text-right text-text-secondary">{formatLargeNumber(item.values.y1)}</td>
      <td className="px-6 py-3 text-[13px] font-mono-numbers text-right text-text-secondary">{formatLargeNumber(item.values.y2)}</td>
      <td className="px-6 py-3 text-[13px] font-mono-numbers text-right text-text-muted">{formatLargeNumber(item.values.y3)}</td>
      
      <td className="px-6 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {item.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-profit" />}
          {item.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-loss" />}
          {item.trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-text-muted" />}
          <span className={cn(
            "text-[12px] font-mono-numbers",
            item.trend === 'up' ? 'text-profit' : item.trend === 'down' ? 'text-loss' : 'text-text-muted'
          )}>
            {item.yoyGrowth > 0 ? '+' : ''}{item.yoyGrowth.toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-6 py-3 text-right hidden md:table-cell">
        <div className="flex justify-end">
          <Sparkline values={vals} />
        </div>
      </td>
    </tr>
  );
}

export function FinancialsTable({ data, searchQuery }: FinancialsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data.rows;
    const lowerQ = searchQuery.toLowerCase();
    
    // Recursive filter to keep parents if children match, or children if parent matches
    const filterMetrics = (metrics: FinancialMetric[]): FinancialMetric[] => {
      const result: FinancialMetric[] = [];
      for (const m of metrics) {
        const matchesSelf = m.metric.toLowerCase().includes(lowerQ);
        let matchingChildren: FinancialMetric[] = [];
        
        if (m.subMetrics) {
          matchingChildren = filterMetrics(m.subMetrics);
        }

        if (matchesSelf || matchingChildren.length > 0) {
          result.push({
            ...m,
            subMetrics: matchingChildren.length > 0 ? matchingChildren : m.subMetrics
          });
        }
      }
      return result;
    };

    return filterMetrics(data.rows);
  }, [data.rows, searchQuery]);

  const handleExport = () => {
    let csv = data.headers.join(',') + ',YoY Growth\n';
    
    const serializeRow = (m: FinancialMetric, prefix = '') => {
      csv += `${prefix}${m.metric},${m.values.y0},${m.values.y1},${m.values.y2},${m.values.y3},${m.yoyGrowth.toFixed(2)}%\n`;
      if (m.subMetrics && expandedRows[m.id]) {
        m.subMetrics.forEach(sub => serializeRow(sub, '  '));
      }
    };

    filteredData.forEach(row => serializeRow(row));
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-bg-base relative">
      <div className="absolute top-2 right-4 z-20">
        <button 
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-bg-elevated border border-border-subtle rounded hover:border-border-focus hover:text-text-primary transition-all text-text-muted"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-bg-surface sticky top-0 z-20 shadow-sm border-b border-border-primary">
            <tr>
              <th className="px-6 py-4 text-[12px] font-semibold text-text-muted uppercase tracking-wider">{data.headers[0]}</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-text-muted text-right uppercase tracking-wider">{data.headers[1]}</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-text-muted text-right uppercase tracking-wider">{data.headers[2]}</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-text-muted text-right uppercase tracking-wider">{data.headers[3]}</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-text-muted text-right uppercase tracking-wider">{data.headers[4]}</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-text-muted text-right uppercase tracking-wider">YoY Change</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-text-muted text-right uppercase tracking-wider hidden md:table-cell">Trend (4Y)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary/30 relative">
            <AnimatePresence mode="popLayout">
              {filteredData.map((row) => (
                <MetricRowGroup 
                  key={row.id} 
                  row={row} 
                  expandedRows={expandedRows} 
                  onToggle={toggleRow} 
                  searchQuery={searchQuery}
                />
              ))}
            </AnimatePresence>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-muted text-[13px]">
                  No statements match your search "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricRowGroup({ 
  row, 
  expandedRows, 
  onToggle,
  searchQuery
}: { 
  row: FinancialMetric, 
  expandedRows: Record<string, boolean>, 
  onToggle: (id: string) => void,
  searchQuery: string
}) {
  // If we have an active search that matched children, auto-expand
  const isExpanded = expandedRows[row.id] || (searchQuery.length > 0 && !!row.subMetrics);

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="contents"
      >
        <MetricRow item={row} expanded={isExpanded} onToggle={onToggle} />
      </motion.tr>
      
      <AnimatePresence>
        {isExpanded && row.subMetrics && row.subMetrics.map(sub => (
          <motion.tr
            key={sub.id}
            layout
            initial={{ opacity: 0, height: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
            exit={{ opacity: 0, height: 0, scaleY: 0.8 }}
            transition={{ duration: 0.2 }}
            className="contents"
          >
            <MetricRow item={sub} level={1} expanded={false} onToggle={() => {}} />
          </motion.tr>
        ))}
      </AnimatePresence>
    </>
  );
}
