import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { RegisterInput, LoginInput } from '../lib/validators.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';

const router = Router();

// ── POST /register ──────────────────────────────────────────────────
router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = RegisterInput.parse(req.body);

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user with a default portfolio
      const user = await prisma.user.create({
        data: {
          email: data.email,
          hashedPassword,
          displayName: data.displayName,
          portfolios: {
            create: {
              name: 'Default',
              cash: 100000,
              startingBalance: 100000,
            },
          },
          watchlists: {
            create: {},
          },
        },
        include: {
          portfolios: true,
        },
      });

      const token = generateToken(user.id);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          portfolios: user.portfolios,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /login ─────────────────────────────────────────────────────
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = LoginInput.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { portfolios: true },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const validPassword = await bcrypt.compare(
        data.password,
        user.hashedPassword,
      );

      if (!validPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = generateToken(user.id);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          portfolios: user.portfolios,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /me ─────────────────────────────────────────────────────────
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          portfolios: {
            include: {
              _count: {
                select: { positions: true, orders: true },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        portfolios: user.portfolios,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
