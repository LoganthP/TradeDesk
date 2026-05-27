import type { Request } from 'express';

export function getRouteParam(req: Request, key: string): string {
  const value = req.params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function getQueryString(req: Request, key: string): string | undefined {
  const value = req.query[key];
  if (Array.isArray(value)) return value[0]?.toString();
  if (typeof value === 'string') return value;
  return undefined;
}
