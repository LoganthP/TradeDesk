import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Globe, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useChart } from '@/store/useChart';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

const generateMockData = (): MarketItem[] => [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.34, changePercent: 1.35, volume: '45.2M' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 402.12, change: -1.23, changePercent: -0.31, volume: '22.1M' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 850.20, change: 45.60, changePercent: 5.67, volume: '68.5M' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 180.50, change: -4.20, changePercent: -2.27, volume: '88.3M' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.22, change: 1.45, changePercent: 0.82, volume: '35.6M' },
  { symbol: 'META', name: 'Meta Platforms', price: 485.10, change: 12.30, changePercent: 2.60, volume: '18.9M' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 145.20, change: 0.85, changePercent: 0.59, volume: '25.4M' },
  { symbol: 'AMD', name: 'Advanced Micro', price: 165.40, change: -3.40, changePercent: -2.01, volume: '42.1M' },
];

export function MarketsPage() {
  const navigate = useNavigate();
  const setSymbol = useChart(state => state.setSymbol);
  
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load simulation
    setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 800);

    // Live tick simulation
    const interval = setInterval(() => {
      setData(prev => prev.map(item => {
        const volatility = item.price * 0.002;
        const tick = (Math.random() - 0.5) * volatility;
        const newPrice = item.price + tick;
        const newChange = item.change + tick;
        const newPercent = (newChange / (newPrice - newChange)) * 100;
        
        return {
          ...item,
          price: newPrice,
          change: newChange,
          changePercent: newPercent
        };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const openChart = (symbol: string) => {
    setSymbol(symbol);
    navigate('/dashboard');
  };

  const gainers = [...data].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const losers = [...data].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);

  if (loading) {
    return (
      <div className="w-full h-full p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-bg-surface w-48 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-bg-surface rounded-xl"></div>)}
        </div>
        <div className="h-64 bg-bg-surface rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-3 pb-4 border-b border-border-primary">
        <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight">Global Markets</h1>
          <p className="text-[13px] text-text-muted">Live overview of market performance and trending assets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <section className="bg-bg-surface border border-border-primary rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green" />
            <h2 className="text-[15px] font-bold text-text-primary">Top Gainers</h2>
          </div>
          <div className="flex flex-col gap-2">
            {gainers.map(item => (
              <div 
                key={item.symbol}
                onClick={() => openChart(item.symbol)}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-base border border-border-subtle hover:border-border-focus cursor-pointer transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-text-primary">{item.symbol}</span>
                  <span className="text-[12px] text-text-muted">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[14px] font-mono-numbers font-medium text-text-primary">{formatCurrency(item.price)}</span>
                    <span className="text-[12px] font-mono-numbers text-green">
                      +{item.change.toFixed(2)} (+{item.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Losers */}
        <section className="bg-bg-surface border border-border-primary rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red" />
            <h2 className="text-[15px] font-bold text-text-primary">Top Losers</h2>
          </div>
          <div className="flex flex-col gap-2">
            {losers.map(item => (
              <div 
                key={item.symbol}
                onClick={() => openChart(item.symbol)}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-base border border-border-subtle hover:border-border-focus cursor-pointer transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-text-primary">{item.symbol}</span>
                  <span className="text-[12px] text-text-muted">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[14px] font-mono-numbers font-medium text-text-primary">{formatCurrency(item.price)}</span>
                    <span className="text-[12px] font-mono-numbers text-red">
                      {item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sector Heatmap / Market Overview */}
      <section className="bg-bg-surface border border-border-primary rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-text-primary" />
          <h2 className="text-[15px] font-bold text-text-primary">Market Overview</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider">Symbol</th>
                <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider text-right">Price</th>
                <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider text-right">Change</th>
                <th className="pb-3 px-4 text-[12px] font-medium text-text-muted uppercase tracking-wider text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr 
                  key={item.symbol}
                  onClick={() => openChart(item.symbol)}
                  className="border-b border-border-subtle hover:bg-bg-hover cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-text-primary">{item.symbol}</span>
                      <span className="text-[12px] text-text-muted">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[14px] font-mono-numbers text-text-primary">{formatCurrency(item.price)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      "text-[14px] font-mono-numbers font-medium px-2 py-1 rounded",
                      item.changePercent >= 0 ? "text-green bg-green/10" : "text-red bg-red/10"
                    )}>
                      {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[13px] font-mono-numbers text-text-muted">{item.volume}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
