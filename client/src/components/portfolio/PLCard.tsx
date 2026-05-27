import { usePortfolioStore } from '@/store/usePortfolioStore';
import { formatCurrency, formatPercent, getChangeColor, cn } from '@/lib/utils';
import { Wallet, DollarSign, TrendingUp, BarChart2 } from 'lucide-react';

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: React.FC<{ className?: string }>;
  gradient: string;
}

export function PLCard() {
  const { activePortfolio } = usePortfolioStore();

  if (!activePortfolio) return null;

  const holdingsValue = activePortfolio.holdings.reduce(
    (sum, holding) => sum + holding.quantity * holding.currentPrice,
    0,
  );
  const totalValue = activePortfolio.balance + holdingsValue;
  const cash = activePortfolio.balance;
  const unrealizedPnl = activePortfolio.holdings.reduce((sum, holding) => sum + holding.unrealizedPnL, 0);
  const returnPct = activePortfolio.startingBalance > 0
    ? ((totalValue - activePortfolio.startingBalance) / activePortfolio.startingBalance) * 100
    : 0;

  const cards: StatCard[] = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(totalValue),
      icon: Wallet,
      gradient: 'from-accent/10 to-secondary/10',
    },
    {
      label: 'Cash Balance',
      value: formatCurrency(cash),
      sub: `of ${formatCurrency(activePortfolio.startingBalance)} starting`,
      subColor: 'text-text-muted',
      icon: DollarSign,
      gradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      label: 'Unrealized P&L',
      value: formatCurrency(unrealizedPnl),
      sub: unrealizedPnl !== 0 ? (unrealizedPnl > 0 ? '▲ profit' : '▼ loss') : 'no open positions',
      subColor: getChangeColor(unrealizedPnl),
      icon: TrendingUp,
      gradient: unrealizedPnl >= 0 ? 'from-profit/10 to-green-500/5' : 'from-loss/10 to-red-500/5',
    },
    {
      label: 'All-time Return',
      value: formatPercent(returnPct),
      sub: returnPct !== 0 ? `${formatCurrency(totalValue - activePortfolio.startingBalance)} net` : 'from starting balance',
      subColor: getChangeColor(returnPct),
      icon: BarChart2,
      gradient: returnPct >= 0 ? 'from-profit/10 to-green-500/5' : 'from-loss/10 to-red-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn('glass-card p-4 bg-gradient-to-br', card.gradient)}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{card.label}</span>
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
              <card.icon className="w-3.5 h-3.5 text-text-secondary" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-text-primary tabular-nums">{card.value}</p>
          {card.sub && (
            <p className={cn('text-xs mt-1', card.subColor ?? 'text-text-muted')}>{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
