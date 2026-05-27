import express from 'express';
import cors from 'cors';
import { generalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import portfolioRouter from './routes/portfolio.js';
import ordersRouter from './routes/orders.js';
import pricesRouter from './routes/prices.js';
import analyticsRouter from './routes/analytics.js';
import watchlistRouter from './routes/watchlist.js';
import prisma from './lib/prisma.js';
import { getCurrentPrice } from './lib/priceSimulator.js';
import { fillLimitOrder } from './services/orderService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(generalRateLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/watchlist', watchlistRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be registered last)
app.use(errorHandler);

// Periodic check for matching/filling open orders against simulated prices
async function startOrderMatchingEngine() {
  setInterval(async () => {
    try {
      // Find all open orders
      const openOrders = await prisma.order.findMany({
        where: { status: 'OPEN' },
      });

      for (const order of openOrders) {
        try {
          const currentPrice = getCurrentPrice(order.symbol);
          await fillLimitOrder(order.id, currentPrice);
        } catch (err) {
          // Individual order matching error, catch and continue
          console.error(`Error matching order ${order.id}:`, err);
        }
      }
    } catch (err) {
      console.error('Error in order matching engine interval:', err);
    }
  }, 5000); // Check every 5 seconds
}

// Background scheduler for portfolio snapshots (for equity curve)
// We can take a snapshot for each portfolio periodically so the user has historical value points
async function startSnapshotScheduler() {
  setInterval(async () => {
    try {
      const portfolios = await prisma.portfolio.findMany({
        include: { positions: true },
      });

      for (const p of portfolios) {
        try {
          // Calculate current value of the portfolio
          let totalValue = p.cash;
          for (const pos of p.positions) {
            const currentPrice = getCurrentPrice(pos.symbol);
            totalValue += currentPrice * pos.quantity;
          }

          // Create snapshot
          await prisma.portfolioSnapshot.create({
            data: {
              portfolioId: p.id,
              totalValue: Math.round(totalValue * 100) / 100,
            },
          });
        } catch (err) {
          console.error(`Error creating snapshot for portfolio ${p.id}:`, err);
        }
      }
    } catch (err) {
      console.error('Error in portfolio snapshot interval:', err);
    }
  }, 60000); // Take a snapshot every 60 seconds (useful for paper trading simulator)
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Paper Trading Server is running on port ${PORT}`);
  console.log(`👉 CORS Origin allowed: ${corsOrigin}`);
  
  // Start background engines
  startOrderMatchingEngine();
  startSnapshotScheduler();
});
