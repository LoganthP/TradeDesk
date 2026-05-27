import { z } from 'zod';

export const RegisterInput = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).max(50).optional(),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const PlaceOrderInput = z
  .object({
    portfolioId: z.string().min(1),
    symbol: z.string().min(1).max(20).toUpperCase(),
    type: z.enum(['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT']),
    side: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive('Quantity must be positive'),
    price: z.number().positive('Price must be positive').optional(),
  })
  .refine(
    (data) => {
      // Non-market orders require a price
      if (data.type !== 'MARKET' && data.price === undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'Price is required for LIMIT, STOP_LOSS, and TAKE_PROFIT orders',
      path: ['price'],
    },
  );
export type PlaceOrderInput = z.infer<typeof PlaceOrderInput>;

export const ResetPortfolioInput = z.object({
  startingBalance: z
    .number()
    .min(1000, 'Starting balance must be at least $1,000')
    .max(1_000_000, 'Starting balance cannot exceed $1,000,000'),
});
export type ResetPortfolioInput = z.infer<typeof ResetPortfolioInput>;

export const CreatePortfolioInput = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  startingBalance: z
    .number()
    .min(1000, 'Starting balance must be at least $1,000')
    .max(1_000_000, 'Starting balance cannot exceed $1,000,000')
    .default(100_000),
});
export type CreatePortfolioInput = z.infer<typeof CreatePortfolioInput>;

export const WatchlistAddInput = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
});
export type WatchlistAddInput = z.infer<typeof WatchlistAddInput>;

export const AlertInput = z
  .object({
    alertAbove: z.number().positive().optional().nullable(),
    alertBelow: z.number().positive().optional().nullable(),
  })
  .refine(
    (data) => {
      if (
        data.alertAbove !== undefined &&
        data.alertAbove !== null &&
        data.alertBelow !== undefined &&
        data.alertBelow !== null
      ) {
        return data.alertAbove > data.alertBelow;
      }
      return true;
    },
    {
      message: 'alertAbove must be greater than alertBelow',
    },
  );
export type AlertInput = z.infer<typeof AlertInput>;

export const PaginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;
