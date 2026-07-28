import type { NextFunction, Request, Response } from 'express';
import { type ZodType } from 'zod';

import { AppError } from '../utils/app-error.js';

type RequestSource = 'body' | 'params' | 'query';

export function validate<T>(schema: ZodType<T>, source: RequestSource = 'body') {
  return (request: Request, response: Response, next: NextFunction): void => {
    const requestData = (request as unknown as Record<RequestSource, unknown>)[source];
    const parsed = schema.safeParse(requestData);

    if (!parsed.success) {
      next(new AppError('Request validation failed', 400, parsed.error.issues));
      return;
    }

    response.locals.validatedInput = parsed.data;
    next();
  };
}
