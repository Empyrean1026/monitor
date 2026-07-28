import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.js';

const WINDOW_MS = 15 * 60 * 1_000;
const MAX_ATTEMPTS = 5;
const attemptsByIp = new Map<string, number[]>();

export function loginRateLimit(request: Request, _response: Response, next: NextFunction): void {
  const now = Date.now();
  const key = request.ip || 'unknown';
  const activeAttempts = (attemptsByIp.get(key) ?? []).filter((attempt) => now - attempt < WINDOW_MS);

  if (activeAttempts.length >= MAX_ATTEMPTS) {
    attemptsByIp.set(key, activeAttempts);
    next(new AppError('Too many login attempts. Please try again later.', 429));
    return;
  }

  activeAttempts.push(now);
  attemptsByIp.set(key, activeAttempts);
  next();
}
