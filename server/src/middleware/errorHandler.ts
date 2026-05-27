import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Global error-handling middleware. Must be registered with 4 parameters
 * so Express treats it as an error handler.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Zod validation errors → 400 ──────────────────────────────────
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({ error: 'Validation failed', details: formatted });
    return;
  }

  // ── Prisma known request errors ───────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (err.meta?.target as string[]) ?? [];
        res.status(409).json({
          error: `Duplicate value for: ${target.join(', ')}`,
        });
        return;
      }
      case 'P2025':
        // Record not found
        res.status(404).json({ error: 'Record not found' });
        return;
      case 'P2003':
        // Foreign key constraint
        res.status(400).json({ error: 'Related record not found' });
        return;
      default:
        res.status(400).json({ error: `Database error: ${err.code}` });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: 'Invalid data provided' });
    return;
  }

  // ── AppError (custom errors with status codes) ────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // ── Generic Error ─────────────────────────────────────────────────
  if (err instanceof Error) {
    console.error('Unhandled error:', err.message, err.stack);
    res.status(500).json({
      error:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Internal server error',
    });
    return;
  }

  // ── Unknown error type ────────────────────────────────────────────
  console.error('Unknown error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

/**
 * Custom application error with an HTTP status code.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
