import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { PlaceOrderInput, PaginationQuery } from '../lib/validators.js';
import { placeMarketOrder, placePendingOrder } from '../services/orderService.js';
import { getRouteParam, getQueryString } from '../lib/http.js';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

// ── POST / — Place order ────────────────────────────────────────────
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = PlaceOrderInput.parse(req.body);

      // Verify portfolio belongs to user
      const portfolio = await prisma.portfolio.findFirst({
        where: { id: data.portfolioId, userId: req.userId },
      });

      if (!portfolio) {
        res.status(404).json({ error: 'Portfolio not found or not owned by you' });
        return;
      }

      if (data.type === 'MARKET') {
        // Market orders fill immediately
        const result = await placeMarketOrder(
          data.portfolioId,
          data.symbol,
          data.side,
          data.quantity,
        );
        res.status(201).json(result);
      } else {
        // Limit, Stop-Loss, Take-Profit orders stay OPEN
        const order = await placePendingOrder(
          data.portfolioId,
          data.symbol,
          data.type,
          data.side,
          data.quantity,
          data.price!,
        );
        res.status(201).json({ order });
      }
    } catch (err) {
      next(err);
    }
  },
);

// ── GET / — List orders with filters ────────────────────────────────
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = PaginationQuery.parse(req.query);
      const status = getQueryString(req, 'status');
      const portfolioId = getQueryString(req, 'portfolioId');

      // Build where clause
      const where: Record<string, unknown> = {
        portfolio: { userId: req.userId },
      };

      if (status) {
        where.status = status;
      }

      if (portfolioId) {
        where.portfolioId = portfolioId;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            trades: true,
          },
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /:id — Cancel order ──────────────────────────────────────
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getRouteParam(req, 'id');

      // Find the order and verify ownership
      const order = await prisma.order.findFirst({
        where: {
          id,
          portfolio: { userId: req.userId },
        },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status !== 'OPEN') {
        res.status(400).json({
          error: `Cannot cancel order with status: ${order.status}`,
        });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      res.json({ order: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
