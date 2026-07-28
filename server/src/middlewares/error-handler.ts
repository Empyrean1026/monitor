import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { sendFailure } from '../utils/api-response.js';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  void next;
  if (error instanceof ZodError) return sendFailure(response, 'Request validation failed', error.issues, 400);

  if (error instanceof AppError) return sendFailure(response, error.message, error.errors, error.statusCode);

  console.error(error);
  const errors = env.NODE_ENV === 'production' ? [] : [error instanceof Error ? error.message : 'Unknown error'];
  return sendFailure(response, 'Internal server error', errors, 500);
};
