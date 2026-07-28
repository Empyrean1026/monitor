import { Router } from 'express';

import { recentOrdersController } from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middlewares/validate.js';
import { recentOrdersQuerySchema } from '../validators/order.validator.js';

export const orderRouter = Router();

orderRouter.get('/', authMiddleware, validate(recentOrdersQuerySchema, 'query'), asyncHandler(recentOrdersController));
