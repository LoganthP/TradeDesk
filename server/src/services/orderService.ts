import prisma from '../lib/prisma.js';
import { getCurrentPrice } from '../lib/priceSimulator.js';
import { applySlippage } from '../lib/slippage.js';
import { calculateRealizedPnl } from '../lib/pnl.js';
import { AppError } from '../middleware/errorHandler.js';

interface MarketOrderResult {
  order: {
    id: string;
    symbol: string;
    type: string;
    side: string;
    quantity: number;
    status: string;
    filledAt: Date | null;
  };
  trade: {
    id: string;
    fillPrice: number;
    fillQty: number;
    realizedPnl: number;
  };
}

/**
 * Place and immediately fill a market order.
 */
export async function placeMarketOrder(
  portfolioId: string,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
): Promise<MarketOrderResult> {
  // 1. Get current price and apply slippage
  const rawPrice = getCurrentPrice(symbol);
  const fillPrice = applySlippage(rawPrice, side);

  // 2. Get the portfolio
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: { positions: true },
  });

  if (!portfolio) {
    throw new AppError(404, 'Portfolio not found');
  }

  const totalCost = fillPrice * quantity;

  if (side === 'BUY') {
    // ── BUY: check cash, deduct, create/update position ──────────
    if (portfolio.cash < totalCost) {
      throw new AppError(400, `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.cash.toFixed(2)}`);
    }

    const existingPosition = portfolio.positions.find(
      (p) => p.symbol === symbol,
    );

    // Use a transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct cash
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cash: { decrement: totalCost } },
      });

      // Create or update position (weighted average cost)
      if (existingPosition) {
        const newQuantity = existingPosition.quantity + quantity;
        const newAvgCost =
          (existingPosition.avgCost * existingPosition.quantity +
            fillPrice * quantity) /
          newQuantity;

        await tx.position.update({
          where: { id: existingPosition.id },
          data: { quantity: newQuantity, avgCost: newAvgCost },
        });
      } else {
        await tx.position.create({
          data: {
            portfolioId,
            symbol,
            quantity,
            avgCost: fillPrice,
            side: 'LONG',
          },
        });
      }

      // Create order
      const order = await tx.order.create({
        data: {
          portfolioId,
          symbol,
          type: 'MARKET',
          side: 'BUY',
          quantity,
          price: fillPrice,
          status: 'FILLED',
          filledAt: new Date(),
        },
      });

      // Create trade
      const trade = await tx.trade.create({
        data: {
          orderId: order.id,
          portfolioId,
          symbol,
          fillPrice,
          fillQty: quantity,
          side: 'BUY',
          realizedPnl: 0,
        },
      });

      return { order, trade };
    });

    return {
      order: {
        id: result.order.id,
        symbol: result.order.symbol,
        type: result.order.type,
        side: result.order.side,
        quantity: result.order.quantity,
        status: result.order.status,
        filledAt: result.order.filledAt,
      },
      trade: {
        id: result.trade.id,
        fillPrice: result.trade.fillPrice,
        fillQty: result.trade.fillQty,
        realizedPnl: result.trade.realizedPnl,
      },
    };
  } else {
    // ── SELL: check position, add cash, reduce position ──────────
    const existingPosition = portfolio.positions.find(
      (p) => p.symbol === symbol,
    );

    if (!existingPosition) {
      throw new AppError(400, `No position found for ${symbol}`);
    }

    if (existingPosition.quantity < quantity) {
      throw new AppError(
        400,
        `Insufficient position. You have ${existingPosition.quantity} shares of ${symbol}, tried to sell ${quantity}`,
      );
    }

    const realizedPnl = calculateRealizedPnl(
      existingPosition.avgCost,
      fillPrice,
      quantity,
      existingPosition.side as 'LONG' | 'SHORT',
    );

    const result = await prisma.$transaction(async (tx) => {
      // Add cash from sale
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cash: { increment: totalCost } },
      });

      const newQuantity = existingPosition.quantity - quantity;

      if (newQuantity === 0) {
        // Close position entirely
        await tx.position.delete({
          where: { id: existingPosition.id },
        });
      } else {
        // Reduce position (avgCost stays the same)
        await tx.position.update({
          where: { id: existingPosition.id },
          data: { quantity: newQuantity },
        });
      }

      // Create order
      const order = await tx.order.create({
        data: {
          portfolioId,
          symbol,
          type: 'MARKET',
          side: 'SELL',
          quantity,
          price: fillPrice,
          status: 'FILLED',
          filledAt: new Date(),
        },
      });

      // Create trade with realized P&L
      const trade = await tx.trade.create({
        data: {
          orderId: order.id,
          portfolioId,
          symbol,
          fillPrice,
          fillQty: quantity,
          side: 'SELL',
          realizedPnl,
        },
      });

      return { order, trade };
    });

    return {
      order: {
        id: result.order.id,
        symbol: result.order.symbol,
        type: result.order.type,
        side: result.order.side,
        quantity: result.order.quantity,
        status: result.order.status,
        filledAt: result.order.filledAt,
      },
      trade: {
        id: result.trade.id,
        fillPrice: result.trade.fillPrice,
        fillQty: result.trade.fillQty,
        realizedPnl: result.trade.realizedPnl,
      },
    };
  }
}

/**
 * Place a limit / stop-loss / take-profit order (stays OPEN).
 */
export async function placePendingOrder(
  portfolioId: string,
  symbol: string,
  type: 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT',
  side: 'BUY' | 'SELL',
  quantity: number,
  price: number,
) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: { positions: true },
  });

  if (!portfolio) {
    throw new AppError(404, 'Portfolio not found');
  }

  // For BUY orders, validate the user has enough cash at the limit price
  if (side === 'BUY') {
    const totalCost = price * quantity;
    if (portfolio.cash < totalCost) {
      throw new AppError(
        400,
        `Insufficient funds for this order. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.cash.toFixed(2)}`,
      );
    }
  }

  // For SELL orders, validate position exists
  if (side === 'SELL') {
    const position = portfolio.positions.find((p) => p.symbol === symbol);
    if (!position || position.quantity < quantity) {
      throw new AppError(
        400,
        `Insufficient position for ${symbol}`,
      );
    }
  }

  const order = await prisma.order.create({
    data: {
      portfolioId,
      symbol,
      type,
      side,
      quantity,
      price,
      status: 'OPEN',
    },
  });

  return order;
}

/**
 * Check if a limit order should be filled given the current price.
 */
export async function fillLimitOrder(
  orderId: string,
  currentPrice: number,
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.status !== 'OPEN' || order.price === null) {
    return false;
  }

  let shouldFill = false;

  switch (order.type) {
    case 'LIMIT':
      // LIMIT BUY fills when price drops to or below limit
      // LIMIT SELL fills when price rises to or above limit
      if (order.side === 'BUY' && currentPrice <= order.price) shouldFill = true;
      if (order.side === 'SELL' && currentPrice >= order.price) shouldFill = true;
      break;
    case 'STOP_LOSS':
      // STOP_LOSS BUY triggers when price rises to stop
      // STOP_LOSS SELL triggers when price drops to stop
      if (order.side === 'BUY' && currentPrice >= order.price) shouldFill = true;
      if (order.side === 'SELL' && currentPrice <= order.price) shouldFill = true;
      break;
    case 'TAKE_PROFIT':
      // Similar to limit in direction
      if (order.side === 'BUY' && currentPrice <= order.price) shouldFill = true;
      if (order.side === 'SELL' && currentPrice >= order.price) shouldFill = true;
      break;
  }

  if (shouldFill) {
    // Fill via market order logic
    try {
      await placeMarketOrder(
        order.portfolioId,
        order.symbol,
        order.side as 'BUY' | 'SELL',
        order.quantity,
      );

      // Mark the original pending order as filled
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'FILLED', filledAt: new Date() },
      });

      return true;
    } catch {
      // If fill fails (e.g., insufficient funds), leave order open
      return false;
    }
  }

  return false;
}
