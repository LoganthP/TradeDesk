import { formatCurrency, cn } from '@/lib/utils';
import type { Analytics } from '@/lib/types';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Award, TrendingDown, Activity, Target, Zap, BarChart2, Trophy, AlertTriangle } from 'lucide-react';

interface StatsGridProps {
  analytics: Analytics | undefined;
  isLoading: boolean;
}

interface Stat {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
  icon: React.FC<{ className?: string }>;
}

export function StatsGrid({ analytics, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!analytics) return null;

  const stats: Stat[] = [
    {
      label: 'Total Trades',
      value: String(analytics.totalTrades),
      icon: Activity,
    },
    {
      label: 'Win Rate',
      value: `${analytics.winRate.toFixed(1)}%`,
      sub: analytics.winRate >= 50 ? 'Above 50%' : 'Below 50%',
      colorClass: analytics.winRate >= 50 ? 'text-profit' : 'text-loss',
      icon: Target,
    },
    {
      label: 'Profit Factor',
      value: analytics.profitFactor >= 999 ? '∞' : analytics.profitFactor.toFixed(2),
      sub: analytics.profitFactor >= 1.5 ? 'Good' : analytics.profitFactor >= 1 ? 'Break even' : 'Losing',
      colorClass: analytics.profitFactor >= 1.5 ? 'text-profit' : analytics.profitFactor >= 1 ? 'text-yellow-400' : 'text-loss',
      icon: Zap,
    },
    {
      label: 'Avg Win',
      value: formatCurrency(analytics.avgWin),
      colorClass: 'text-profit',
      icon: Trophy,
    },
    {
      label: 'Avg Loss',
      value: formatCurrency(analytics.avgLoss),
      colorClass: 'text-loss',
      icon: AlertTriangle,
    },
    {
      label: 'Total P&L',
      value: formatCurrency(analytics.totalPnl),
      colorClass: analytics.totalPnl >= 0 ? 'text-profit' : 'text-loss',
      icon: BarChart2,
    },
    {
      label: 'Max Drawdown',
      value: `${analytics.maxDrawdown.toFixed(2)}%`,
      sub: analytics.maxDrawdown < 10 ? 'Low risk' : analytics.maxDrawdown < 25 ? 'Moderate' : 'High risk',
      colorClass: analytics.maxDrawdown < 10 ? 'text-profit' : analytics.maxDrawdown < 25 ? 'text-yellow-400' : 'text-loss',
      icon: TrendingDown,
    },
    {
      label: 'Sharpe Ratio',
      value: analytics.sharpeRatio.toFixed(2),
      sub: analytics.sharpeRatio >= 1 ? 'Good' : analytics.sharpeRatio >= 0 ? 'Fair' : 'Poor',
      colorClass: analytics.sharpeRatio >= 1 ? 'text-profit' : analytics.sharpeRatio >= 0 ? 'text-yellow-400' : 'text-loss',
      icon: Activity,
    },
    {
      label: 'Best Trade',
      value: formatCurrency(analytics.bestTrade),
      colorClass: 'text-profit',
      icon: Award,
    },
    {
      label: 'Worst Trade',
      value: formatCurrency(analytics.worstTrade),
      colorClass: 'text-loss',
      icon: TrendingDown,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">{stat.label}</span>
          </div>
          <p className={cn('text-xl font-bold font-mono tabular-nums', stat.colorClass ?? 'text-text-primary')}>
            {stat.value}
          </p>
          {stat.sub && (
            <p className={cn('text-xs mt-1', stat.colorClass ? `${stat.colorClass}/70` : 'text-text-muted')}>
              {stat.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
