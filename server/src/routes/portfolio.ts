import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { ResetPortfolioInput, CreatePortfolioInput } from '../lib/validators.js';
import { getPortfolioWithPnl, resetPortfolio } from '../services/portfolioService.js';
import { getRouteParam } from '../lib/http.js';

const router = Router();

// All portfolio routes require authentication
router.use(authMiddleware);

// ── GET / — List all portfolios ─────────────────────────────────────
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolios = await prisma.portfolio.findMany({
        where: { userId: req.userId },
        include: {
          positions: true,
          _count: {
            select: {
              orders: {
                where: { status: 'OPEN' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Build the response with an explicit type
      const result = portfolios.map((p) => ({
        id: p.id,
        name: p.name,
        cash: p.cash,
        startingBalance: p.startingBalance,
        createdAt: p.createdAt,
        positions: p.positions,
        openOrdersCount: p._count.orders,
      }));

      res.json({ portfolios: result });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /:id — Single portfolio with P&L ────────────────────────────
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getRouteParam(req, 'id');
      // Verify ownership
      const ownership = await prisma.portfolio.findFirst({
        where: { id, userId: req.userId },
      });

      if (!ownership) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      const portfolio = await getPortfolioWithPnl(id);
      res.json({ portfolio });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST / — Create new portfolio ───────────────────────────────────
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = CreatePortfolioInput.parse(req.body);

      const portfolio = await prisma.portfolio.create({
        data: {
          userId: req.userId!,
          name: data.name,
          cash: data.startingBalance,
          startingBalance: data.startingBalance,
        },
      });

      res.status(201).json({ portfolio });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /reset — Reset portfolio ───────────────────────────────────
router.post(
  '/reset',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = ResetPortfolioInput.parse(req.body);
      const portfolioId = req.body.portfolioId as string;

      if (!portfolioId) {
        res.status(400).json({ error: 'portfolioId is required' });
        return;
      }

      // Verify ownership
      const ownership = await prisma.portfolio.findFirst({
        where: { id: portfolioId, userId: req.userId },
      });

      if (!ownership) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      const result = await resetPortfolio(portfolioId, data.startingBalance);
      res.json({ portfolio: result, message: 'Portfolio reset successfully' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
