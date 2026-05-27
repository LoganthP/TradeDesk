import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { WatchlistAddInput, AlertInput } from '../lib/validators.js';
import { getCurrentPrice } from '../lib/priceSimulator.js';
import { SUPPORTED_SYMBOLS } from '../lib/priceSimulator.js';
import { getRouteParam } from '../lib/http.js';

const router = Router();

router.use(authMiddleware);

// ── GET / — User's watchlist items with current prices ──────────────
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get or create watchlist for user
      let watchlist = await prisma.watchlist.findFirst({
        where: { userId: req.userId },
        include: { items: true },
      });

      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: { userId: req.userId! },
          include: { items: true },
        });
      }

      // Enrich items with current prices
      const items = watchlist.items.map((item) => {
        let currentPrice: number | null = null;
        try {
          currentPrice = getCurrentPrice(item.symbol);
        } catch {
          // Symbol not supported in simulator
        }

        return {
          id: item.id,
          symbol: item.symbol,
          currentPrice,
          alertAbove: item.alertAbove,
          alertBelow: item.alertBelow,
          alertTriggered:
            currentPrice !== null &&
            ((item.alertAbove !== null && currentPrice >= item.alertAbove) ||
              (item.alertBelow !== null && currentPrice <= item.alertBelow)),
        };
      });

      res.json({ watchlistId: watchlist.id, items });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST / — Add symbol to watchlist ────────────────────────────────
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = WatchlistAddInput.parse(req.body);

      // Validate symbol
      if (!SUPPORTED_SYMBOLS.includes(data.symbol)) {
        res.status(400).json({
          error: `Unsupported symbol: ${data.symbol}. Supported: ${SUPPORTED_SYMBOLS.join(', ')}`,
        });
        return;
      }

      // Get or create watchlist
      let watchlist = await prisma.watchlist.findFirst({
        where: { userId: req.userId },
      });

      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: { userId: req.userId! },
        });
      }

      // Check for duplicate
      const existing = await prisma.watchlistItem.findFirst({
        where: {
          watchlistId: watchlist.id,
          symbol: data.symbol,
        },
      });

      if (existing) {
        res.status(409).json({ error: `${data.symbol} is already in your watchlist` });
        return;
      }

      const item = await prisma.watchlistItem.create({
        data: {
          watchlistId: watchlist.id,
          symbol: data.symbol,
        },
      });

      const currentPrice = getCurrentPrice(data.symbol);

      res.status(201).json({
        item: {
          id: item.id,
          symbol: item.symbol,
          currentPrice,
          alertAbove: item.alertAbove,
          alertBelow: item.alertBelow,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /:id — Remove item from watchlist ────────────────────────
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getRouteParam(req, 'id');

      // Verify ownership through watchlist → user
      const item = await prisma.watchlistItem.findFirst({
        where: {
          id,
          watchlist: { userId: req.userId },
        },
      });

      if (!item) {
        res.status(404).json({ error: 'Watchlist item not found' });
        return;
      }

      await prisma.watchlistItem.delete({ where: { id } });

      res.json({ message: 'Item removed from watchlist' });
    } catch (err) {
      next(err);
    }
  },
);

// ── PUT /:id/alert — Set alert thresholds ──────────────────────────
router.put(
  '/:id/alert',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getRouteParam(req, 'id');
      const data = AlertInput.parse(req.body);

      // Verify ownership
      const item = await prisma.watchlistItem.findFirst({
        where: {
          id,
          watchlist: { userId: req.userId },
        },
      });

      if (!item) {
        res.status(404).json({ error: 'Watchlist item not found' });
        return;
      }

      const updated = await prisma.watchlistItem.update({
        where: { id },
        data: {
          alertAbove: data.alertAbove ?? null,
          alertBelow: data.alertBelow ?? null,
        },
      });

      res.json({ item: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
