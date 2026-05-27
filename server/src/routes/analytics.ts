import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAnalytics } from '../services/analyticsService.js';
import prisma from '../lib/prisma.js';
import { getRouteParam } from '../lib/http.js';

const router = Router();

router.use(authMiddleware);

// ── GET /:portfolioId — Portfolio analytics ─────────────────────────
router.get(
  '/:portfolioId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolioId = getRouteParam(req, 'portfolioId');

      // Verify ownership
      const portfolio = await prisma.portfolio.findFirst({
        where: { id: portfolioId, userId: req.userId },
      });

      if (!portfolio) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      const analytics = await getAnalytics(portfolioId);
      res.json({ analytics });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
