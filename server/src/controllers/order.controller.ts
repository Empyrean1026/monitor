import type { Request, Response } from 'express';

import { getRecentOrders, type RecentOrdersQuery } from '../services/order.service.js';
import { sendSuccess } from '../utils/api-response.js';

export async function recentOrdersController(request: Request, response: Response): Promise<Response> {
  void request;
  return sendSuccess(response, await getRecentOrders(response.locals.validatedInput as RecentOrdersQuery));
}
