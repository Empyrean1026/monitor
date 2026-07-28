import type { Request, Response } from 'express';

import { sendFailure } from '../utils/api-response.js';

export function notFoundHandler(request: Request, response: Response): Response {
  return sendFailure(response, `Route ${request.method} ${request.originalUrl} was not found`, [], 404);
}
