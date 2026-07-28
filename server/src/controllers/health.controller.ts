import type { Request, Response } from 'express';

import { getHealthStatus } from '../services/health.service.js';
import { sendSuccess } from '../utils/api-response.js';

export async function healthController(_request: Request, response: Response): Promise<Response> {
  const health = await getHealthStatus();
  return sendSuccess(response, health);
}
