import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, ChevronDown } from 'lucide-react';
import { useChart } from '@/store/useChart';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { usePriceStream } from '@/hooks/usePriceStream';
import { useSettings } from '@/store/useSettings';
import { useToast } from '@/store/useToast';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ORDER_TYPES, type OrderType } from '@/lib/constants';

type OrderSide = 'BUY' | 'SELL';

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  MARKET: 'Market',
  LIMIT: 'Limit',
  STOP_LOSS: 'Stop Loss',
  TAKE_PROFIT: 'Take Profit',
};

export function OrderForm() {
  const symbol = useChart((s) => s.symbol);
  const { activePortfolio, placeOrder } = usePortfolioStore();
  const { quote } = usePriceStream(symbol);
  const { defaultOrderType, confirmOrders } = useSettings();
  const addToast = useToast((s) => s.addToast);

  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>(defaultOrderType.toUpperCase() as OrderType);
  const [quantityStr, setQuantityStr] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [useUSD, setUseUSD] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const quantity = parseFloat(quantityStr) || 0;
  const limitPrice = parseFloat(priceStr) || quote?.price || 0;

  const currentPosition = activePortfolio?.holdings?.find((p: { symbol: string }) => p.symbol === symbol);
  const holdingPrice = currentPosition?.currentPrice || 0;
  const marketPrice = quote?.price || holdingPrice || 0;
  const orderPrice = orderType === 'MARKET' ? marketPrice : limitPrice;

  // Auto-fill limit price from current price when switching to non-market
  useEffect(() => {
    if (orderType !== 'MARKET' && !priceStr && quote) {
      setPriceStr(quote.price.toFixed(2));
    }
  }, [orderType, priceStr, quote]);

  // Compute qty from USD input
  const computedQty = useUSD && orderPrice > 0 ? quantity / orderPrice : quantity;
  const totalCost = computedQty * orderPrice;

  // Validation
  const cash = activePortfolio?.balance ?? 0;
  const availableToSell = (currentPosition as { quantity?: number } | undefined)?.quantity ?? 0;

  let validationError = '';
  if (!activePortfolio) validationError = 'No active portfolio selected';
  else if (computedQty <= 0) validationError = 'Enter a valid quantity';
  else if (orderType !== 'MARKET' && limitPrice <= 0) validationError = 'Enter a valid price';
  else if (side === 'BUY' && totalCost > cash) validationError = `Insufficient funds (need ${formatCurrency(totalCost)}, have ${formatCurrency(cash)})`;
  else if (side === 'SELL' && !currentPosition) validationError = `No ${symbol} shares to sell`;
  else if (side === 'SELL' && currentPosition && computedQty > availableToSell) validationError = `Only ${availableToSell} shares available`;

  const handleSubmit = () => {
    if (validationError) {
      addToast({
        title: 'Order blocked',
        message: validationError,
        type: 'error',
      });
      return;
    }

    if (confirmOrders) {
      if (!window.confirm(`Are you sure you want to ${side} ${computedQty.toFixed(4)} ${symbol} at ${orderType === 'MARKET' ? 'Market Price' : limitPrice}?`)) {
        return;
      }
    }

    placeOrder(
      symbol,
      side,
      computedQty,
      orderType !== 'MARKET' ? limitPrice : (quote?.price || 0)
    );

    addToast({
      title: `${side} ${symbol}`,
      message: `${ORDER_TYPE_LABELS[orderType]} order placed for ${computedQty.toFixed(4)} ${symbol}`,
      type: 'success',
    });

    setQuantityStr('');
    setPriceStr('');
    setSuccessMsg(`${ORDER_TYPE_LABELS[orderType]} ${side} order placed!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const labelStyle = { color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const };
  const valueStyle = { color: '#F0F2F5', fontFamily: "'DM Mono', monospace", fontSize: '14px' };
  const inputStyle = (id: string) => ({
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${isFocused === id ? '#00D4AA' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '6px',
    color: '#F0F2F5',
    fontFamily: "'DM Mono', monospace",
    fontSize: '15px',
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  });

  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      <h3 style={labelStyle}>Place Order</h3>

      {/* BUY / SELL tabs */}
      <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {(['BUY', 'SELL'] as OrderSide[]).map((s) => {
          const isActive = side === s;
          const bg = isActive ? (s === 'BUY' ? 'rgba(0,212,170,0.18)' : 'rgba(255,77,106,0.18)') : 'transparent';
          const color = isActive ? (s === 'BUY' ? '#00D4AA' : '#FF4D6A') : 'rgba(255,255,255,0.45)';
          const fontWeight = isActive ? 600 : 400;
          return (
            <button
              type="button"
              key={s}
              id={`order-side-${s.toLowerCase()}`}
              onClick={() => setSide(s)}
              style={{ flex: 1, padding: '10px 0', background: bg, color, fontWeight, fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {s === 'BUY' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color }} /> Buy
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color }}>
                  <TrendingDown className="w-3.5 h-3.5" style={{ color }} /> Sell
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order type selector */}
      <div className="relative">
        <label style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>Order Type</label>
        <button
          type="button"
          id="order-type-selector"
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          style={{ ...inputStyle('order-type-selector'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <span style={{ color: '#F0F2F5' }}>{ORDER_TYPE_LABELS[orderType]}</span>
          <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.65)' }} />
        </button>
        {showTypeMenu && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#0F1217] border border-[rgba(255,255,255,0.12)] rounded-lg shadow-2xl z-30 overflow-hidden">
            {(Object.keys(ORDER_TYPES) as OrderType[]).map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => { setOrderType(type); setShowTypeMenu(false); }}
                className={cn('w-full px-3 py-2.5 text-sm text-left transition-colors hover:bg-white/5')}
                style={{ color: orderType === type ? '#00D4AA' : '#F0F2F5', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {ORDER_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quantity / USD toggle */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label style={labelStyle}>
            {useUSD ? 'Amount (USD)' : 'Quantity'}
          </label>
          <button
            type="button"
            onClick={() => setUseUSD(!useUSD)}
            style={{ color: '#00D4AA', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            Switch to {useUSD ? 'Shares' : 'USD'}
          </button>
        </div>
        <input
          id="order-quantity"
          type="number"
          min="0"
          step={useUSD ? '10' : '1'}
          value={quantityStr}
          onChange={(e) => setQuantityStr(e.target.value)}
          onFocus={() => setIsFocused('qty')}
          onBlur={() => setIsFocused(null)}
          placeholder={useUSD ? '0.00' : '0'}
          style={inputStyle('qty')}
        />
      </div>

      {/* Limit price (for non-market orders) */}
      {orderType !== 'MARKET' && (
        <div>
          <label style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>
            {orderType === 'STOP_LOSS' ? 'Stop Price' : orderType === 'TAKE_PROFIT' ? 'Target Price' : 'Limit Price'}
          </label>
          <input
            id="order-price"
            type="number"
            min="0"
            step="0.01"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            onFocus={() => setIsFocused('price')}
            onBlur={() => setIsFocused(null)}
            placeholder={quote?.price.toFixed(2) ?? '0.00'}
            style={inputStyle('price')}
          />
        </div>
      )}

      {/* Order summary */}
      <div className="bg-black/20 rounded-lg p-3 space-y-1.5">
        <div className="flex justify-between items-center">
          <span style={labelStyle}>Market Price</span>
          <span style={valueStyle}>{quote ? formatCurrency(quote.price) : '—'}</span>
        </div>
        {computedQty > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span style={labelStyle}>Shares</span>
              <span style={valueStyle}>{computedQty.toFixed(useUSD ? 4 : 0)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[rgba(255,255,255,0.08)] pt-1.5">
              <span style={labelStyle}>Est. Total</span>
              <span style={{ ...valueStyle, color: side === 'BUY' ? '#FF4D6A' : '#00D4AA', fontWeight: 'bold' }}>
                {side === 'BUY' ? '-' : '+'}{formatCurrency(totalCost)}
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center">
          <span style={labelStyle}>Buying Power</span>
          <span style={valueStyle}>{formatCurrency(cash)}</span>
        </div>
        {side === 'SELL' && (
          <div className="flex justify-between items-center border-t border-[rgba(255,255,255,0.08)] pt-1.5">
            <span style={labelStyle}>Available to Sell</span>
            <span style={{ ...valueStyle, color: availableToSell > 0 ? '#00D4AA' : '#FF4D6A' }}>
              {availableToSell > 0 ? `${availableToSell} shares` : 'None'}
            </span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)' }}>
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00D4AA' }} />
          <span style={{ color: '#00D4AA', fontSize: '12px' }}>{successMsg}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        id="order-submit"
        onClick={handleSubmit}
        disabled={!!validationError}
        title={validationError}
        style={{
          background: side === 'BUY' ? '#00D4AA' : '#FF4D6A',
          color: '#0A0C0F',
          fontWeight: 700,
          fontSize: '14px',
          height: '44px',
          width: '100%',
          borderRadius: '8px',
          border: 'none',
          cursor: validationError ? 'not-allowed' : 'pointer',
          opacity: validationError ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'filter 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.filter = validationError ? 'none' : 'brightness(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
      >
        {`${side === 'BUY' ? 'Buy' : 'Sell'} ${symbol}`}
      </button>

      {validationError && (
        <p style={{ color: '#FF4D6A', fontSize: '11px', textAlign: 'center', margin: '0', padding: '0 4px' }}>
          {validationError}
        </p>
      )}
    </div>
  );
}
