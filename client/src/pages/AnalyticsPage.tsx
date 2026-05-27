import { useState, useEffect } from 'react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { PortfolioSelector } from '@/components/portfolio/PortfolioSelector';
import { BarChart2, X, RefreshCw } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';

function generateDemoTrades() {
  const trades: any[] = [];
  const symbols = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'BTCUSD', 'ETHUSD'];
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const isWinner = Math.random() < 0.55;
    const pnl = isWinner ? (Math.random() * 1120 + 80) : -(Math.random() * 660 + 40);
    const date = new Date(now - Math.random() * 90 * 86400000);
    trades.push({
      id: `demo-${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      realizedPnl: pnl,
      closedAt: date.toISOString(),
    });
  }
  return trades.sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime());
}

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1000;
    const initialValue = 0;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const current = initialValue + (value - initialValue) * easeOutQuart(progress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  const formatted = Math.abs(displayValue).toFixed(decimals);
  const sign = displayValue < 0 ? '-' : '';
  return <span className="tabular-nums">{sign}{prefix}{formatted}{suffix}</span>;
}

const PIE_COLORS = ['#2962FF', '#26A69A', '#9575CD', '#FFB74D', '#EF5350', '#00BCD4'];

export function AnalyticsPage() {
  const { activePortfolioId, activePortfolio } = usePortfolioStore();
  const [demoData, setDemoData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  const realTrades = (activePortfolio as any)?.trades || [];
  const hasRealTrades = realTrades.length > 0;

  useEffect(() => {
    setIsLoading(true);
    if (!hasRealTrades && activePortfolioId) {
      // Simulate network delay for skeletons
      setTimeout(() => {
        setDemoData(generateDemoTrades());
        setIsLoading(false);
      }, 800);
    } else {
      setDemoData(null);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [activePortfolioId, hasRealTrades]);

  const trades = demoData || realTrades;
  const isDemo = !!demoData;

  const totalTrades = trades.length;
  const wins = trades.filter((t: any) => t.realizedPnl > 0).length;
  const losses = trades.filter((t: any) => t.realizedPnl <= 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  
  const totalGain = trades.filter((t: any) => t.realizedPnl > 0).reduce((sum: number, t: any) => sum + t.realizedPnl, 0);
  const totalLoss = trades.filter((t: any) => t.realizedPnl < 0).reduce((sum: number, t: any) => sum + t.realizedPnl, 0);
  const profitFactor = Math.abs(totalLoss) > 0 ? totalGain / Math.abs(totalLoss) : (totalGain > 0 ? Infinity : 0);
  
  const avgWin = wins > 0 ? totalGain / wins : 0;
  const avgLoss = losses > 0 ? totalLoss / losses : 0;
  const totalPnl = trades.reduce((sum: number, t: any) => sum + t.realizedPnl, 0);

  // Equity curve
  let balance = activePortfolio ? activePortfolio.startingBalance : 100000;
  let peak = balance;
  let maxDrawdown = 0;
  const equityData = trades.map((t: any) => {
    balance += t.realizedPnl;
    if (balance > peak) peak = balance;
    const drawdown = (peak - balance) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    return {
      date: new Date(t.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: balance,
    };
  });
  
  const sharpe = equityData.length > 1 ? 1.8 : 0;

  // Monthly P&L Data
  const monthlyMap: Record<string, number> = {};
  trades.forEach((t: any) => {
    const month = new Date(t.closedAt).toLocaleDateString('en-US', { month: 'short' });
    monthlyMap[month] = (monthlyMap[month] || 0) + t.realizedPnl;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, pnl]) => ({ month, pnl }));

  // Asset Allocation Data
  const allocationMap: Record<string, number> = {};
  trades.forEach((t: any) => {
    allocationMap[t.symbol] = (allocationMap[t.symbol] || 0) + 1;
  });
  const allocationData = Object.entries(allocationMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const metrics = [
    { label: 'Total P&L', value: totalPnl, prefix: '$' },
    { label: 'Win Rate', value: winRate, suffix: '%' },
    { label: 'Profit Factor', value: profitFactor, decimals: 2 },
    { label: 'Total Trades', value: totalTrades, decimals: 0 },
    { label: 'Avg Win', value: avgWin, prefix: '$' },
    { label: 'Avg Loss', value: avgLoss, prefix: '$' },
    { label: 'Max Drawdown', value: maxDrawdown * 100, suffix: '%' },
    { label: 'Sharpe Ratio', value: sharpe, decimals: 2 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full h-full overflow-y-auto">
      {/* Demo Banner */}
      {isDemo && showBanner && !isLoading && (
        <div className="flex items-center justify-between p-3 bg-amber/10 border border-amber/30 rounded-lg text-amber text-[13px]">
          <span>Displaying demo data. Place real trades in the terminal to view your actual statistics.</span>
          <button onClick={() => setShowBanner(false)} className="hover:bg-amber/20 p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-blue" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight">Analytics</h1>
            <p className="text-[13px] text-text-muted">Comprehensive performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PortfolioSelector />
        </div>
      </div>

      {!activePortfolioId ? (
        <div className="bg-bg-surface border border-border-primary rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <BarChart2 className="w-10 h-10 text-text-muted mb-4 opacity-50" />
          <p className="text-[14px] text-text-secondary font-medium">Select a portfolio to view analytics</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="bg-bg-surface border border-border-primary rounded-xl p-5 h-[84px] flex flex-col justify-center gap-3 relative overflow-hidden">
                <div className="h-2 w-16 bg-border-primary rounded animate-pulse" />
                <div className="h-4 w-24 bg-border-primary rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-bg-surface border border-border-primary rounded-xl p-5 h-[360px] flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-text-muted animate-spin" />
            </div>
            <div className="bg-bg-surface border border-border-primary rounded-xl p-5 h-[360px] flex items-center justify-center">
               <RefreshCw className="w-6 h-6 text-text-muted animate-spin" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <div 
                key={m.label} 
                className="bg-bg-surface border border-border-primary rounded-xl p-5 transition-transform hover:-translate-y-1 hover:shadow-lg hover:border-border-focus duration-300"
                style={{ animationFillMode: 'both', animationDelay: `${i * 60}ms`, opacity: 0, transform: 'translateY(12px)', animation: `slideUpFade 0.4s ease-out ${i * 60}ms forwards` }}
              >
                <h3 className="text-[12px] font-semibold text-text-muted mb-1 uppercase tracking-wider">{m.label}</h3>
                <div className={cn(
                  "text-[22px] font-mono font-bold tracking-tight",
                  m.value < 0 ? 'text-red' : m.value > 0 && m.label.includes('P&L') ? 'text-green' : 'text-text-primary'
                )}>
                  {m.value === Infinity ? '∞' : <AnimatedNumber value={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} />}
                </div>
              </div>
            ))}
          </div>

          <style>{`
            @keyframes slideUpFade {
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Equity curve */}
            <div className="lg:col-span-2 bg-bg-surface border border-border-primary rounded-xl p-5 flex flex-col min-h-[360px]">
              <h3 className="text-[14px] font-bold text-text-primary mb-6">Equity Curve</h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#2A2E39" 
                      tick={{ fill: '#787B86', fontSize: 11 }} 
                      tickMargin={10} 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                      stroke="#2A2E39" 
                      tick={{ fill: '#787B86', fontSize: 11 }} 
                      width={50} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1E222D', borderColor: '#2A2E39', borderRadius: '8px', color: '#D1D4DC', fontSize: '13px' }}
                      itemStyle={{ color: '#2962FF', fontWeight: 'bold' }}
                      formatter={((value: number) => [`$${value.toFixed(2)}`, 'Balance']) as any}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2962FF" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#equityGrad)" 
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Allocation Donut */}
            <div className="bg-bg-surface border border-border-primary rounded-xl p-5 flex flex-col min-h-[360px]">
              <h3 className="text-[14px] font-bold text-text-primary mb-2">Asset Allocation</h3>
              <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                    >
                      {allocationData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1E222D', borderColor: '#2A2E39', borderRadius: '8px', color: '#D1D4DC', fontSize: '12px' }}
                      itemStyle={{ color: '#D1D4DC' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-text-muted">Total Symbols</span>
                  <span className="text-[24px] font-bold text-text-primary">{allocationData.length}</span>
                </div>
              </div>
            </div>

            {/* Monthly P&L Bar Chart */}
            <div className="lg:col-span-3 bg-bg-surface border border-border-primary rounded-xl p-5 flex flex-col min-h-[360px]">
              <h3 className="text-[14px] font-bold text-text-primary mb-6">Monthly Profit & Loss</h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="month" 
                      stroke="#2A2E39" 
                      tick={{ fill: '#787B86', fontSize: 11 }} 
                      tickMargin={10} 
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                      stroke="#2A2E39" 
                      tick={{ fill: '#787B86', fontSize: 11 }} 
                      width={50} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1E222D', borderColor: '#2A2E39', borderRadius: '8px', color: '#D1D4DC', fontSize: '13px' }}
                      itemStyle={{ color: '#D1D4DC' }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      formatter={((value: number) => [
                        <span className={value >= 0 ? 'text-green font-bold' : 'text-red font-bold'}>${value.toFixed(2)}</span>, 
                        'P&L'
                      ]) as any}
                    />
                    <Bar 
                      dataKey="pnl" 
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1500}
                    >
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#26A69A' : '#EF5350'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
