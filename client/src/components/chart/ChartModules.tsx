// @ts-nocheck
import { useEffect, useRef, useState, MouseEvent as ReactMouseEvent, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  LineStyle,
  ColorType,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts';
import { useChart } from '@/store/useChart';
import { useIndicatorStore } from '@/store/useIndicatorStore';
import { useSettings } from '@/store/useSettings';
import { usePriceStream } from '@/hooks/usePriceStream';
import type { Candle } from '@/lib/types';
import { getCandles, normalizeTimeframe } from '@/api/prices';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Bell, ArrowUp, ArrowDown, ListPlus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalScale } from '@/lib/animationVariants';
import { cn } from '@/lib/utils';
import { useMultiChartStore, type ChartPanelState } from '@/store/useMultiChartStore';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useToast } from '@/store/useToast';
import { formatCurrency } from '@/lib/utils';
import { ChartPanelHeader } from './ChartPanelHeader';
import { WatchlistPanel } from '../watchlist/WatchlistPanel';
import { NewsPanel } from '../panels/NewsPanel';
import { CalendarPanel } from '../panels/CalendarPanel';

const TIMEFRAME_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
  '1W': 604800,
};

const MIN_VISIBLE_BARS = 45;
const APPROX_BAR_WIDTH = 7;

function generateFallbackCandles(symbol: string, timeframe: string) {
  return new Promise<Candle[]>((resolve) => {
    setTimeout(() => {
      const candles: Candle[] = [];
      let price = 100;
      let seed = 0;
      for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);
      
      const tfSeconds = TIMEFRAME_SECONDS[normalizeTimeframe(timeframe)] ?? TIMEFRAME_SECONDS['1D'];
      
      const now = Math.floor(Date.now() / 1000);
      let time = now - 300 * tfSeconds;
      
      for (let i = 0; i < 300; i++) {
        seed = (seed * 16807) % 2147483647;
        const rand = (seed - 1073741823) / 1073741823;
        const change = price * 0.02 * rand;
        
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.abs(change) * 0.5;
        const low = Math.min(open, close) - Math.abs(change) * 0.5;
        const volume = Math.floor(Math.abs(change) * 10000) + 1000;
        
        candles.push({ time, open, high, low, close, volume });
        
        price = close;
        time += tfSeconds;
      }
      resolve(candles);
    }, 500);
  });
}

async function fetchOHLCV(symbol: string, timeframe: string) {
  try {
    return await getCandles(symbol, normalizeTimeframe(timeframe));
  } catch (error) {
    console.warn('Falling back to generated candles:', error);
    return generateFallbackCandles(symbol, normalizeTimeframe(timeframe));
  }
}

function toVolume(candles: Candle[]) {
  return candles.map((c) => ({
    time: c.time as Time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
  }));
}

function calcEMA(candles: Candle[], period: number) {
  const closes = candles.map(c => c.close);
  const k = 2 / (period + 1);
  const result: { time: Time; value: number }[] = [];
  let ema: number | null = null;
  for (let i = 0; i < closes.length; i++) {
    if (ema === null) {
      if (i === period - 1) {
        ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
        result.push({ time: candles[i].time as Time, value: ema });
      }
    } else {
      ema = closes[i] * k + ema * (1 - k);
      result.push({ time: candles[i].time as Time, value: ema });
    }
  }
  return result;
}

function calcBB(candles: Candle[], period = 20, stdDevMult = 2) {
  const closes = candles.map(c => c.close);
  const upper: { time: Time; value: number }[] = [];
  const mid: { time: Time; value: number }[] = [];
  const lower: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - avg) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper.push({ time: candles[i].time as Time, value: avg + stdDevMult * std });
    mid.push({ time: candles[i].time as Time, value: avg });
    lower.push({ time: candles[i].time as Time, value: avg - stdDevMult * std });
  }
  return { upper, mid, lower };
}

function calcVWAP(candles: Candle[]) {
  const result: { time: Time; value: number }[] = [];
  let cumVol = 0;
  let cumPV = 0;
  for (const c of candles) {
    cumVol += c.volume;
    const typPrice = (c.high + c.low + c.close) / 3;
    cumPV += typPrice * c.volume;
    result.push({ time: c.time as Time, value: cumPV / cumVol });
  }
  return result;
}

interface MenuState {
  x: number;
  y: number;
  price: number;
  open: boolean;
}

export function ChartModule({ 
  panel, 
  isActive = true, 
  chartRegistry 
}: { 
  panel: ChartPanelState; 
  isActive?: boolean;
  chartRegistry: React.MutableRefObject<Record<string, { chart: IChartApi, series: ISeriesApi<'Candlestick'> }>>;
}) {
  const { syncCrosshair } = useMultiChartStore();
  const { indicators } = useIndicatorStore();
  const settings = useSettings();
  const { activeRange, isExtended, isLogScale, isPercentMode, isAutoScale } = useChart();
  const symbol = panel.symbol;
  const activeTimeframe = normalizeTimeframe(panel.timeframe);

  const activeIndicators = useMemo(() => {
    const hiddenIds = new Set(indicators.filter(i => i.hidden).map(i => i.id));
    return new Set(panel.indicators.filter(id => !hiddenIds.has(id)));
  }, [panel.indicators, indicators]);
  const indicatorSettings = useMemo(() => Object.fromEntries(indicators.map(i => [i.id, i.settings])), [indicators]);
  
  const { quote } = usePriceStream(symbol);
  const { activePortfolio } = usePortfolioStore();
  const [isLoading, setIsLoading] = useState(true);
  const [menu, setMenu] = useState<MenuState>({ x: 0, y: 0, price: 0, open: false });

  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMidRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lastCandleRef = useRef<CandlestickData<Time> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const loadedCandleCountRef = useRef(0);

  const bbSeriesRef = {
    current: {
      setData: (data: { upper: any; mid: any; lower: any }) => {
        bbUpperRef.current?.setData(data.upper);
        bbMidRef.current?.setData(data.mid);
        bbLowerRef.current?.setData(data.lower);
      }
    }
  };

  const settleVisibleRange = () => {
    const chart = chartRef.current;
    const wrapper = chartWrapperRef.current;
    const candleCount = loadedCandleCountRef.current;
    if (!chart || !wrapper || candleCount === 0) return;

    const visibleBars = Math.max(MIN_VISIBLE_BARS, Math.floor(wrapper.clientWidth / APPROX_BAR_WIDTH));
    const rightOffset = isExtended ? 25 : 6;
    chart.timeScale().setVisibleLogicalRange({
      from: Math.max(0, candleCount - visibleBars),
      to: candleCount - 1 + rightOffset,
    });
  };

  useEffect(() => {
    if (!chartWrapperRef.current) return;

    const chart = createChart(chartWrapperRef.current, {
      width: chartWrapperRef.current.clientWidth,
      height: chartWrapperRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: settings.theme === 'light' ? '#FFFFFF' : '#0A0C0F' },
        textColor: settings.theme === 'light' ? '#787B86' : '#787B86',
        fontSize: settings.fontSize === 'small' ? 10 : settings.fontSize === 'large' ? 14 : 12,
        fontFamily: "'DM Mono', monospace",
      },
      grid: {
        vertLines: { color: settings.theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', visible: settings.gridLines },
        horzLines: { color: settings.theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', visible: settings.gridLines },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { 
          color: settings.theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)', 
          width: 1, 
          style: settings.crosshairStyle === 'solid' ? LineStyle.Solid : settings.crosshairStyle === 'dotted' ? LineStyle.Dotted : LineStyle.Dashed, 
          labelBackgroundColor: settings.theme === 'light' ? '#F0F2F5' : '#2A2E39' 
        },
        horzLine: { 
          color: settings.theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)', 
          width: 1, 
          style: settings.crosshairStyle === 'solid' ? LineStyle.Solid : settings.crosshairStyle === 'dotted' ? LineStyle.Dotted : LineStyle.Dashed, 
          labelBackgroundColor: settings.theme === 'light' ? '#F0F2F5' : '#2A2E39' 
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const resizeObs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.resize(entry.contentRect.width, entry.contentRect.height);
        requestAnimationFrame(settleVisibleRange);
      }
    });
    resizeObs.observe(chartWrapperRef.current);

    const upColor = settings.candleColors === 'monochrome' ? '#FFFFFF' : settings.candleColors === 'neon' ? '#00E5FF' : '#26A69A';
    const downColor = settings.candleColors === 'monochrome' ? '#131722' : settings.candleColors === 'neon' ? '#FF00FF' : '#EF5350';
    const borderDown = settings.candleColors === 'monochrome' ? '#FFFFFF' : downColor;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: upColor, downColor: downColor,
      borderUpColor: upColor, borderDownColor: borderDown,
      wickUpColor: upColor, wickDownColor: borderDown,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const ema9Series = chart.addSeries(LineSeries, { color: '#FF9800', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ema21Series = chart.addSeries(LineSeries, { color: '#E91E63', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ema50Series = chart.addSeries(LineSeries, { color: '#2196F3', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
    const vwapSeries = chart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });

    const bbUpper = chart.addSeries(LineSeries, { color: 'rgba(149,117,205,0.7)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false });
    const bbMid = chart.addSeries(LineSeries, { color: 'rgba(149,117,205,0.4)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const bbLower = chart.addSeries(LineSeries, { color: 'rgba(149,117,205,0.7)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ema9SeriesRef.current = ema9Series;
    ema21SeriesRef.current = ema21Series;
    ema50SeriesRef.current = ema50Series;
    vwapSeriesRef.current = vwapSeries;
    bbUpperRef.current = bbUpper;
    bbMidRef.current = bbMid;
    bbLowerRef.current = bbLower;

    // Register chart globally for sync
    chartRegistry.current[panel.id] = { chart, series: candleSeries };

    let isSyncing = false;
    const handleTimeScaleChange = (range: any) => {
      if (!range || !syncCrosshair || isSyncing || loadedCandleCountRef.current === 0) return;
      Object.entries(chartRegistry.current).forEach(([id, reg]) => {
        if (id !== panel.id) {
          try {
            isSyncing = true;
            reg.chart.timeScale().setVisibleLogicalRange(range);
          } catch (e) {
            // ignore
          } finally {
            isSyncing = false;
          }
        }
      });
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleTimeScaleChange);

    let isCrosshairSyncing = false;
    const handleCrosshairMove = (param: any) => {
      if (!syncCrosshair || isCrosshairSyncing) return;
      
      const entries = Object.entries(chartRegistry.current);
      if (!param.time || param.point === undefined || param.point.x < 0 || param.point.y < 0) {
        entries.forEach(([id, reg]) => {
          if (id !== panel.id) {
            reg.chart.clearCrosshairPosition();
          }
        });
        return;
      }
      
      const price = param.seriesData.get(candleSeries)?.close ?? param.seriesData.get(candleSeries)?.value ?? 0;
      
      entries.forEach(([id, reg]) => {
        if (id !== panel.id) {
          try {
            isCrosshairSyncing = true;
            // Best effort price sync if price isn't accurate across completely different symbols
            reg.chart.setCrosshairPosition(price as number, param.time, reg.series);
          } catch (e) {
            // ignore
          } finally {
            isCrosshairSyncing = false;
          }
        }
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      delete chartRegistry.current[panel.id];
      resizeObs.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [settings.theme, settings.fontSize, settings.gridLines, settings.crosshairStyle, settings.candleColors, syncCrosshair]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.priceScale('right').applyOptions({
      mode: isLogScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      autoScale: isAutoScale,
      scaleMargins: isPercentMode ? { top: 0.35, bottom: 0.35 } : { top: 0.1, bottom: 0.2 },
    });
  }, [isLogScale, isAutoScale, isPercentMode]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().applyOptions({ rightOffset: isExtended ? 25 : 6 });
    settleVisibleRange();
  }, [isExtended]);

  useEffect(() => {
    if (!chartRef.current) return;
    settleVisibleRange();
  }, [activeRange]);

  useEffect(() => {
    if (!chartRef.current) return;
    let cancelled = false;
    setIsLoading(true);
    lastCandleRef.current = null;
    loadedCandleCountRef.current = 0;
    
    volumeSeriesRef.current?.setData([]);
    ema9SeriesRef.current?.setData([]);
    ema21SeriesRef.current?.setData([]);
    ema50SeriesRef.current?.setData([]);
    vwapSeriesRef.current?.setData([]);
    bbSeriesRef.current?.setData({ upper: [], mid: [], lower: [] });

    const ema9Cfg = indicatorSettings['EMA9'] || {};
    const ema21Cfg = indicatorSettings['EMA21'] || {};
    const ema50Cfg = indicatorSettings['EMA50'] || {};
    const vwapCfg = indicatorSettings['VWAP'] || {};
    const bbCfg = indicatorSettings['BB'] || {};

    if (ema9Cfg.color) ema9SeriesRef.current?.applyOptions({ color: ema9Cfg.color, lineWidth: ema9Cfg.lineWidth ?? 1 });
    if (ema21Cfg.color) ema21SeriesRef.current?.applyOptions({ color: ema21Cfg.color, lineWidth: ema21Cfg.lineWidth ?? 1 });
    if (ema50Cfg.color) ema50SeriesRef.current?.applyOptions({ color: ema50Cfg.color, lineWidth: ema50Cfg.lineWidth ?? 1.5 });
    if (vwapCfg.color) vwapSeriesRef.current?.applyOptions({ color: vwapCfg.color, lineWidth: vwapCfg.lineWidth ?? 1.5 });
    if (bbCfg.color) {
      bbUpperRef.current?.applyOptions({ color: bbCfg.color });
      bbLowerRef.current?.applyOptions({ color: bbCfg.color });
    }
    
    fetchOHLCV(symbol, activeTimeframe).then(candles => {
      if (cancelled) return;
      const lightweightCandles = candles.map(c => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      }));
      candleSeriesRef.current?.setData(lightweightCandles);
      lastCandleRef.current = lightweightCandles[lightweightCandles.length - 1];
      loadedCandleCountRef.current = lightweightCandles.length;

      requestAnimationFrame(settleVisibleRange);

      if (activeIndicators.has('Vol')) volumeSeriesRef.current?.setData(toVolume(candles));
      else volumeSeriesRef.current?.setData([]);

      if (activeIndicators.has('EMA9')) ema9SeriesRef.current?.setData(calcEMA(candles, ema9Cfg.period ?? 9));
      else ema9SeriesRef.current?.setData([]);

      if (activeIndicators.has('EMA21')) ema21SeriesRef.current?.setData(calcEMA(candles, ema21Cfg.period ?? 21));
      else ema21SeriesRef.current?.setData([]);

      if (activeIndicators.has('EMA50')) ema50SeriesRef.current?.setData(calcEMA(candles, ema50Cfg.period ?? 50));
      else ema50SeriesRef.current?.setData([]);

      if (activeIndicators.has('VWAP')) vwapSeriesRef.current?.setData(calcVWAP(candles));
      else vwapSeriesRef.current?.setData([]);

      if (activeIndicators.has('BB')) bbSeriesRef.current?.setData(calcBB(candles, bbCfg.period ?? 20, bbCfg.stdDev ?? 2));
      else bbSeriesRef.current?.setData({ upper: [], mid: [], lower: [] });
      
      requestAnimationFrame(settleVisibleRange);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [symbol, activeTimeframe, activeIndicators, indicatorSettings]);

  useEffect(() => {
    if (!quote || !candleSeriesRef.current || !lastCandleRef.current) return;
    const last = lastCandleRef.current;
    const tfSeconds = TIMEFRAME_SECONDS[activeTimeframe] ?? TIMEFRAME_SECONDS['1D'];
    const quoteTime = Math.floor(Date.now() / 1000);
    const nextCandleTime = Math.floor(quoteTime / tfSeconds) * tfSeconds;

    if (typeof last.time === 'number' && nextCandleTime > last.time) {
      const next: CandlestickData<Time> = {
        time: nextCandleTime as Time,
        open: last.close,
        high: Math.max(last.close, quote.price),
        low: Math.min(last.close, quote.price),
        close: quote.price,
      };
      candleSeriesRef.current.update(next);
      lastCandleRef.current = next;
      return;
    }

    const updated: CandlestickData<Time> = {
      ...last,
      close: quote.price,
      high: Math.max(last.high, quote.price),
      low: Math.min(last.low, quote.price),
    };
    candleSeriesRef.current.update(updated);
    lastCandleRef.current = updated;
  }, [quote, activeTimeframe]);

  const handleContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    if (!chartRef.current || !candleSeriesRef.current) return;
    const rect = chartWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const price = candleSeriesRef.current.coordinateToPrice(e.clientY - rect.top) as number;
    if (price !== null) {
      setMenu({
        x: e.clientX,
        y: e.clientY,
        price: Number(price.toFixed(2)),
        open: true,
      });
    }
  };

  useEffect(() => {
    const onClickOutside = () => setMenu(m => ({ ...m, open: false }));
    window.addEventListener('click', onClickOutside);
    return () => window.removeEventListener('click', onClickOutside);
  }, []);

  // Update position price lines and trade markers in real time
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !activePortfolio) return;

    // 1. Clear existing price lines
    priceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch (e) {
        // ignore
      }
    });
    priceLinesRef.current = [];

    // 2. Add position average price line if it exists for this symbol
    const currentPosition = activePortfolio.holdings.find(
      (h) => h.symbol === symbol
    );
    if (currentPosition && currentPosition.quantity > 0) {
      try {
        const positionLine = series.createPriceLine({
          price: currentPosition.averagePrice,
          color: '#00D4AA',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `LONG ${currentPosition.quantity.toFixed(2)} @ ${currentPosition.averagePrice.toFixed(2)}`,
        });
        priceLinesRef.current.push(positionLine);
      } catch (e) {
        console.error('Failed to create price line:', e);
      }
    }

    // 3. Add trade markers for this symbol
    const symbolTrades = activePortfolio.trades.filter(
      (t) => t.symbol === symbol
    );
    const tfSeconds = TIMEFRAME_SECONDS[activeTimeframe] ?? 60;

    if (symbolTrades.length > 0) {
      // Group trades by candle time to avoid duplicate marker times
      const tradesByCandleTime: Record<number, typeof symbolTrades> = {};
      symbolTrades.forEach((trade) => {
        const tradeTime = Math.floor(trade.timestamp / 1000);
        const candleTime = Math.floor(tradeTime / tfSeconds) * tfSeconds;
        if (!tradesByCandleTime[candleTime]) {
          tradesByCandleTime[candleTime] = [];
        }
        tradesByCandleTime[candleTime].push(trade);
      });

      const markers = Object.entries(tradesByCandleTime).map(([timeStr, trades]) => {
        const candleTime = parseInt(timeStr, 10);
        const totalBuyQty = trades.filter(t => t.side === 'BUY').reduce((sum, t) => sum + t.quantity, 0);
        const totalSellQty = trades.filter(t => t.side === 'SELL').reduce((sum, t) => sum + t.quantity, 0);
        
        const isBuy = totalBuyQty >= totalSellQty;
        const sideText = totalBuyQty > 0 && totalSellQty > 0 
          ? `B:${totalBuyQty.toFixed(1)} S:${totalSellQty.toFixed(1)}`
          : totalBuyQty > 0 
            ? `BUY ${totalBuyQty.toFixed(1)}` 
            : `SELL ${totalSellQty.toFixed(1)}`;

        const avgPrice = trades.reduce((sum, t) => sum + t.price, 0) / trades.length;

        return {
          time: candleTime as Time,
          position: (isBuy ? 'belowBar' : 'aboveBar') as any,
          color: isBuy ? '#26a69a' : '#ef5350',
          shape: (isBuy ? 'arrowUp' : 'arrowDown') as any,
          text: `${sideText} @ ${avgPrice.toFixed(2)}`,
          size: 1.5,
        };
      }).sort((a, b) => (a.time as number) - (b.time as number));

      try {
        series.setMarkers(markers);
      } catch (e) {
        console.error('Failed to set markers:', e);
      }
    } else {
      try {
        series.setMarkers([]);
      } catch (e) {
        // ignore
      }
    }
  }, [activePortfolio, symbol, isLoading, activeTimeframe]);

  return (
    <div 
      className="chart-wrapper flex-1 min-h-0 relative w-full h-full" 
      ref={chartWrapperRef}
      onContextMenu={handleContextMenu}
    >
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-10 bg-bg-void/50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="flex items-end gap-1 mb-2 opacity-50">
              {[30, 50, 40, 70, 45, 60, 20, 80, 55, 30].map((h, i) => (
                <div key={i} className="w-1.5 bg-border-focus rounded-t-sm" style={{ height: `${h}px` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menu.open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.12, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="fixed z-50 bg-bg-elevated border border-border-primary rounded-md shadow-2xl py-1 overflow-hidden"
            style={{ 
              left: menu.x + 8 > window.innerWidth - 220 ? window.innerWidth - 220 : menu.x + 8, 
              top: menu.y + 4 > window.innerHeight - 200 ? window.innerHeight - 200 : menu.y + 4,
              width: '260px'
            }}
          >
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-bg-hover text-left group">
              <span className="flex items-center gap-2 text-[13px] text-text-primary">
                <Bell className="w-4 h-4 text-text-muted" /> Add alert on {symbol} @ {menu.price}
              </span>
            </button>
            <div className="h-px bg-border-primary my-1" />
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-bg-hover text-left group">
              <span className="flex items-center gap-2 text-[13px] text-text-primary">
                <ArrowUp className="w-4 h-4 text-blue" /> Buy 1 {symbol} @ {menu.price} limit
              </span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-bg-hover text-left group">
              <span className="flex items-center gap-2 text-[13px] text-text-primary">
                <ArrowDown className="w-4 h-4 text-red" /> Sell 1 {symbol} @ {menu.price} stop
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DOMBookPanel({ symbol }: { symbol: string }) {
  const { quote } = usePriceStream(symbol);
  const [size, setSize] = useState('10');
  const basePrice = quote?.price || 150;
  
  const { activePortfolio, placeOrder } = usePortfolioStore();
  const addToast = useToast((s) => s.addToast);

  // Dynamic step size based on symbol price to match real-world scale
  const step = useMemo(() => {
    if (basePrice > 10000) return 5.0;     // e.g. BTC
    if (basePrice > 1000) return 1.0;      // e.g. ETH
    if (basePrice > 100) return 0.15;      // e.g. AAPL, TSLA
    if (basePrice > 10) return 0.02;       // e.g. SOL
    if (basePrice > 1) return 0.01;
    if (basePrice > 0.1) return 0.001;
    return 0.0001;                         // meme coins
  }, [basePrice]);

  // State for DOM bids and asks
  const [data, setData] = useState(() => {
    const stepVal = basePrice > 10000 ? 5.0 : basePrice > 1000 ? 1.0 : basePrice > 100 ? 0.15 : basePrice > 10 ? 0.02 : 0.01;
    return Array.from({ length: 6 }).map((_, i) => ({
      bidPrice: basePrice - (i + 1) * stepVal,
      bidSize: Math.floor(Math.random() * 400) + 50,
      askPrice: basePrice + (i + 1) * stepVal,
      askSize: Math.floor(Math.random() * 400) + 50,
    }));
  });

  // Keep DOM dynamic with price updates
  useEffect(() => {
    const currentPrice = quote?.price || basePrice;
    setData(
      Array.from({ length: 6 }).map((_, i) => ({
        bidPrice: Number((currentPrice - (i + 1) * step).toFixed(basePrice < 1 ? 4 : 2)),
        bidSize: Math.floor(Math.random() * 350) + 30,
        askPrice: Number((currentPrice + (i + 1) * step).toFixed(basePrice < 1 ? 4 : 2)),
        askSize: Math.floor(Math.random() * 350) + 30,
      }))
    );
  }, [quote?.price, step, basePrice]);

  const maxBidSize = Math.max(...data.map(d => d.bidSize));
  const maxAskSize = Math.max(...data.map(d => d.askSize));

  const formatPrice = (price: number) => {
    if (basePrice < 1) return price.toFixed(4);
    if (basePrice < 10) return price.toFixed(3);
    return price.toFixed(2);
  };

  const bestBid = data[0]?.bidPrice || basePrice;
  const bestAsk = data[0]?.askPrice || basePrice;
  const spread = Math.abs(bestAsk - bestBid);

  // Common order function
  const handleOrder = (side: 'BUY' | 'SELL', price: number) => {
    const qty = parseFloat(size);
    if (!activePortfolio) {
      addToast({ title: 'Order blocked', message: 'No active portfolio selected', type: 'error' });
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      addToast({ title: 'Order blocked', message: 'Enter a valid quantity', type: 'error' });
      return;
    }
    if (side === 'BUY') {
      const totalCost = qty * price;
      if (totalCost > activePortfolio.balance) {
        addToast({
          title: 'Order blocked',
          message: `Insufficient funds (need ${formatCurrency(totalCost)}, have ${formatCurrency(activePortfolio.balance)})`,
          type: 'error'
        });
        return;
      }
    } else {
      const currentPosition = activePortfolio.holdings.find(h => h.symbol === symbol);
      const availableToSell = currentPosition?.quantity || 0;
      if (!currentPosition || qty > availableToSell) {
        addToast({
          title: 'Order blocked',
          message: currentPosition ? `Only ${availableToSell} shares available` : `No ${symbol} shares to sell`,
          type: 'error'
        });
        return;
      }
    }

    placeOrder(symbol, side, qty, price);
    addToast({
      title: `${side} ${symbol}`,
      message: `Limit ${side === 'BUY' ? 'Buy' : 'Sell'} order placed for ${qty.toFixed(4)} ${symbol} @ ${formatPrice(price)}`,
      type: 'success'
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary p-3 overflow-hidden select-none font-mono">
      {/* Symbol & Price */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border-primary">
        <div>
          <span className="text-[14px] font-bold text-text-primary">{symbol} DOM</span>
          <span className="text-[10px] text-text-muted ml-1.5 font-sans">Depth of Market</span>
        </div>
        <div className="text-right">
          <span className="text-[14px] font-bold text-green font-mono-numbers">{quote ? formatPrice(quote.price) : '—'}</span>
          <span className="text-[10px] text-text-muted ml-1">USD</span>
        </div>
      </div>

      {/* DOM Table */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0 text-[11px] font-mono-numbers">
        {/* Asks (Sells) - Red - Rendered top-down or bottom-up */}
        <div className="flex flex-col-reverse gap-0.5 border-b border-border-primary/55 pb-1">
          {data.map((d, i) => (
            <div 
              key={`ask-${i}`} 
              onClick={() => handleOrder('SELL', d.askPrice)}
              className="flex justify-between items-center py-0.5 px-1 hover:bg-red/10 relative rounded transition-all cursor-pointer"
              title={`Click to Sell Limit @ ${formatPrice(d.askPrice)}`}
            >
              <div 
                className="absolute right-0 top-0 bottom-0 bg-red/10 transition-all duration-300 pointer-events-none"
                style={{ width: `${(d.askSize / maxAskSize) * 60}%` }}
              />
              <span className="text-red font-semibold z-10">{formatPrice(d.askPrice)}</span>
              <span className="text-text-primary font-medium z-10 pr-2">{d.askSize}</span>
            </div>
          ))}
        </div>

        {/* Spread info */}
        <div className="flex justify-between items-center py-1.5 px-1 bg-bg-surface/50 text-[10px] font-semibold text-text-muted">
          <span>SPREAD</span>
          <span>{formatPrice(spread)} USD</span>
        </div>

        {/* Bids (Buys) - Green */}
        <div className="flex flex-col gap-0.5 pt-1">
          {data.map((d, i) => (
            <div 
              key={`bid-${i}`} 
              onClick={() => handleOrder('BUY', d.bidPrice)}
              className="flex justify-between items-center py-0.5 px-1 hover:bg-green/10 relative rounded transition-all cursor-pointer"
              title={`Click to Buy Limit @ ${formatPrice(d.bidPrice)}`}
            >
              <div 
                className="absolute right-0 top-0 bottom-0 bg-green/10 transition-all duration-300 pointer-events-none"
                style={{ width: `${(d.bidSize / maxBidSize) * 60}%` }}
              />
              <span className="text-green font-semibold z-10">{formatPrice(d.bidPrice)}</span>
              <span className="text-text-primary font-medium z-10 pr-2">{d.bidSize}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DOM Order Execution Quick Buttons */}
      <div className="flex-shrink-0 pt-3 border-t border-border-primary mt-2">
        <div className="flex gap-2 items-center mb-2">
          <span className="text-[10px] text-text-muted font-sans font-medium uppercase text-center w-8">SIZE:</span>
          <input 
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-16 bg-bg-elevated border border-border-subtle rounded px-1.5 py-0.5 text-center text-[11px] font-semibold text-text-primary outline-none focus:border-border-focus"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleOrder('BUY', bestBid)}
            className="bg-green hover:bg-green/90 text-white font-bold py-1.5 rounded text-[11px] transition-colors shadow-[0_0_8px_rgba(38,166,154,0.15)] flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" /> BUY LMT
          </button>
          <button 
            onClick={() => handleOrder('SELL', bestAsk)}
            className="bg-red hover:bg-red/90 text-white font-bold py-1.5 rounded text-[11px] transition-colors shadow-[0_0_8px_rgba(239,83,80,0.15)] flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" /> SELL LMT
          </button>
        </div>
      </div>
    </div>
  );
}

export function HeatmapPanel() {
  const { updatePanel, activePanelId } = useMultiChartStore();

  const tickers = [
    { ticker: 'AAPL', name: 'Apple Inc.', change: 1.25, price: 175.50 },
    { ticker: 'TSLA', name: 'Tesla Inc.', change: 4.86, price: 244.16 },
    { ticker: 'NVDA', name: 'Nvidia Corp.', change: 5.72, price: 877.38 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', change: -0.65, price: 384.94 },
    { ticker: 'BTC/USD', name: 'Bitcoin', change: 8.42, price: 68420.00 },
    { ticker: 'ETH/USD', name: 'Ethereum', change: 6.15, price: 3510.50 },
    { ticker: 'SOL/USD', name: 'Solana', change: 12.80, price: 178.40 },
    { ticker: 'SPY', name: 'S&P 500 ETF', change: 0.28, price: 512.40 },
    { ticker: 'QQQ', name: 'Nasdaq ETF', change: 0.54, price: 438.80 },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-bg-base relative text-text-primary p-3 overflow-y-auto select-none">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border-primary flex-shrink-0">
        <div>
          <span className="text-[14px] font-bold text-text-primary">Market Heatmap</span>
          <span className="text-[10px] text-text-muted ml-1.5">Interactive performance map</span>
        </div>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 flex-1 min-h-0 pb-2">
        {tickers.map((t) => {
          const isPos = t.change >= 0;
          return (
            <div 
              key={t.ticker}
              onClick={() => {
                updatePanel(activePanelId, { symbol: t.ticker });
              }}
              className={cn(
                "flex flex-col justify-between p-2.5 rounded-lg border cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 transition-all",
                isPos 
                  ? "bg-green/10 border-green/30 hover:bg-green/15" 
                  : "bg-red/10 border-red/30 hover:bg-red/15"
              )}
            >
              <div className="flex justify-between items-start">
                <span className="text-[13px] font-bold font-mono tracking-tight text-text-primary">{t.ticker}</span>
                <span className={cn(
                  "text-[10px] font-bold font-mono-numbers px-1.5 py-0.5 rounded",
                  isPos ? "text-green bg-green/15" : "text-red bg-red/15"
                )}>
                  {isPos ? '+' : ''}{t.change.toFixed(2)}%
                </span>
              </div>
              <div className="mt-4">
                <div className="text-[10px] text-text-muted truncate leading-normal">{t.name}</div>
                <div className="text-[13px] font-bold font-mono-numbers text-text-primary mt-0.5">
                  {t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
