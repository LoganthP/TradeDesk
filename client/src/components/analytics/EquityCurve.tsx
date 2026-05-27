import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatShortDate, cn } from '@/lib/utils';
import type { Analytics } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface EquityCurveProps {
  analytics: Analytics | undefined;
  isLoading: boolean;
}

interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 shadow-xl">
      <p className="text-[11px] text-text-muted mb-1">{label}</p>
      <p className="text-sm font-bold font-mono text-text-primary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function EquityCurve({ analytics, isLoading }: EquityCurveProps) {
  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-xl" />;
  if (!analytics) return null;

  const data = analytics.equityCurve.map((point) => ({
    date: formatShortDate(point.date),
    value: point.value,
  }));

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values) * 0.999;
  const maxVal = Math.max(...values) * 1.001;
  const firstVal = values[0] ?? 0;
  const lastVal = values[values.length - 1] ?? 0;
  const isPositive = lastVal >= firstVal;

  const color = isPositive ? '#22c55e' : '#ef4444';

  if (data.length < 2) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center h-[260px] text-center">
        <p className="text-sm text-text-secondary">Not enough trade history</p>
        <p className="text-xs text-text-muted mt-1">Place some trades to see your equity curve</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Equity Curve</h3>
          <p className="text-xs text-text-muted mt-0.5">Portfolio value over time</p>
        </div>
        <div className="text-right">
          <p className={cn('text-lg font-bold font-mono tabular-nums', isPositive ? 'text-profit' : 'text-loss')}>
            {formatCurrency(lastVal)}
          </p>
          <p className="text-[11px] text-text-muted">{data[data.length - 1]?.date}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: 'transparent' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
