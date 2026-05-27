import { Router, Request, Response, NextFunction } from 'express';
import { getCandles, getQuote, getAllQuotes } from '../services/priceService.js';
import { SUPPORTED_SYMBOLS, SUPPORTED_TIMEFRAMES } from '../lib/priceSimulator.js';
import { priceRateLimiter } from '../middleware/rateLimit.js';
import { getQueryString, getRouteParam } from '../lib/http.js';

const router = Router();

// Apply rate limiter to all price endpoints
router.use(priceRateLimiter);

// ── GET /symbols — List all supported symbols ──────────────────────
router.get(
  '/symbols',
  (_req: Request, res: Response): void => {
    res.json({ symbols: SUPPORTED_SYMBOLS, timeframes: SUPPORTED_TIMEFRAMES });
  },
);

// ── GET /quotes — Get all quotes ────────────────────────────────────
router.get(
  '/quotes',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const symbolsParam = getQueryString(req, 'symbols');
      const symbols = symbolsParam ? symbolsParam.split(',') : undefined;
      const quotes = getAllQuotes(symbols);
      res.json({ quotes });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /:symbol/quote — Current price quote ────────────────────────
router.get(
  '/:symbol/quote',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const symbol = getRouteParam(req, 'symbol').toUpperCase();

      if (!SUPPORTED_SYMBOLS.includes(symbol)) {
        res.status(400).json({
          error: `Unsupported symbol: ${symbol}. Supported: ${SUPPORTED_SYMBOLS.join(', ')}`,
        });
        return;
      }

      const quote = getQuote(symbol);
      res.json(quote);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /:symbol/:timeframe — OHLCV candles ────────────────────────
router.get(
  '/:symbol/:timeframe',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const symbol = getRouteParam(req, 'symbol').toUpperCase();
      const timeframe = getRouteParam(req, 'timeframe');
      const count = Math.min(
        Math.max(parseInt(getQueryString(req, 'count') ?? '', 10) || 200, 1),
        1000,
      );

      if (!SUPPORTED_SYMBOLS.includes(symbol)) {
        res.status(400).json({
          error: `Unsupported symbol: ${symbol}`,
        });
        return;
      }

      if (!SUPPORTED_TIMEFRAMES.includes(timeframe)) {
        res.status(400).json({
          error: `Unsupported timeframe: ${timeframe}. Supported: ${SUPPORTED_TIMEFRAMES.join(', ')}`,
        });
        return;
      }

      const candles = getCandles(symbol, timeframe, count);
      res.json({ symbol, timeframe, count: candles.length, candles });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
