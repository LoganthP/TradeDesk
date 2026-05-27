import { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  time: number; // timestamp
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  ticker?: string;
}

const MOCK_SOURCES = ['Reuters', 'Bloomberg', 'WSJ', 'CNBC', 'Financial Times'];
const MOCK_TICKERS = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'];

function generateMockHeadline(): Omit<NewsArticle, 'id' | 'time'> {
  const isPositive = Math.random() > 0.5;
  const isNeutral = Math.random() > 0.8;
  const ticker = MOCK_TICKERS[Math.floor(Math.random() * MOCK_TICKERS.length)];
  const source = MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)];
  
  const positiveVerbs = ['Surges', 'Beats Estimates', 'Announces Buyback', 'Hits Record High', 'Upgrades', 'Partners with'];
  const negativeVerbs = ['Plummets', 'Misses Estimates', 'Faces Lawsuit', 'Downgrades', 'Halts Production', 'Reports Loss'];
  const neutralVerbs = ['Reports Earnings', 'Holds Annual Meeting', 'Acquires Startup', 'Announces Restructuring'];
  
  let verb = neutralVerbs[Math.floor(Math.random() * neutralVerbs.length)];
  let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';

  if (!isNeutral) {
    if (isPositive) {
      verb = positiveVerbs[Math.floor(Math.random() * positiveVerbs.length)];
      sentiment = 'Bullish';
    } else {
      verb = negativeVerbs[Math.floor(Math.random() * negativeVerbs.length)];
      sentiment = 'Bearish';
    }
  }

  const headline = `${ticker} ${verb} ${isNeutral ? 'in Latest Quarter' : 'Amid Market Volatility'}`;

  return { headline, source, sentiment, ticker };
}

export function NewsPanel() {
  const [articles, setArticles] = useState<NewsArticle[]>(() => {
    // Generate initial 10 articles
    return Array.from({ length: 10 }).map((_, i) => ({
      id: `initial-${i}`,
      time: Date.now() - i * 1000 * 60 * 5, // 5 min intervals
      ...generateMockHeadline()
    }));
  });

  useEffect(() => {
    // Auto-refresh: add new article every 15-30 seconds
    const scheduleNext = () => {
      const delay = Math.random() * 15000 + 15000;
      return setTimeout(() => {
        setArticles(prev => [
          {
            id: `live-${Date.now()}`,
            time: Date.now(),
            ...generateMockHeadline()
          },
          ...prev.slice(0, 49) // Keep last 50
        ]);
        timer = scheduleNext();
      }, delay);
    };

    let timer = scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const getTimeAgo = (ts: number) => {
    const diffMins = Math.floor((now - ts) / 60000);
    if (diffMins === 0) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-primary sticky top-0 bg-bg-base z-10">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-blue" />
          <h2 className="text-[14px] font-bold tracking-tight">News Feed</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Live</span>
        </div>
      </div>

      <div className="flex flex-col gap-px bg-border-primary">
        <AnimatePresence initial={false}>
          {articles.map((article) => (
            <motion.div 
              key={article.id}
              initial={{ height: 0, opacity: 0, backgroundColor: 'rgba(41,98,255,0.2)' }}
              animate={{ height: 'auto', opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
              transition={{ duration: 0.4 }}
              className="p-3 bg-bg-base hover:bg-bg-hover transition-colors overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-text-muted uppercase">{article.source}</span>
                <span className="text-[11px] text-text-muted">{getTimeAgo(article.time)}</span>
              </div>
              <h3 className="text-[13px] font-medium leading-tight mb-2 hover:text-blue cursor-pointer transition-colors">
                {article.headline}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-bg-surface text-text-primary font-medium">
                  {article.ticker}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-medium">
                  {article.sentiment === 'Bullish' && <span className="text-green-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Bullish</span>}
                  {article.sentiment === 'Bearish' && <span className="text-red-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Bearish</span>}
                  {article.sentiment === 'Neutral' && <span className="text-text-muted flex items-center gap-1"><Minus className="w-3 h-3" /> Neutral</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
