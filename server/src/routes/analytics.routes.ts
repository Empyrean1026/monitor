import { Router } from 'express';

import {
  categoryDistributionController,
  customerGrowthController,
  customerLevelsController,
  customerRegionsController,
  inventoryAlertsController,
  orderStatusController,
  overviewController,
  paymentMethodsController,
  salesTrendController,
  topProductsController,
} from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate } from '../middlewares/validate.js';
import {
  commonAnalyticsQuerySchema,
  customerGrowthQuerySchema,
  overviewQuerySchema,
  salesTrendQuerySchema,
  topProductsQuerySchema,
} from '../validators/analytics.validator.js';

export const dashboardRouter = Router();
export const analyticsRouter = Router();

dashboardRouter.get('/overview', authMiddleware, validate(overviewQuerySchema, 'query'), asyncHandler(overviewController));
analyticsRouter.get('/sales-trend', authMiddleware, validate(salesTrendQuerySchema, 'query'), asyncHandler(salesTrendController));
analyticsRouter.get('/category-distribution', authMiddleware, validate(commonAnalyticsQuerySchema, 'query'), asyncHandler(categoryDistributionController));
analyticsRouter.get('/top-products', authMiddleware, validate(topProductsQuerySchema, 'query'), asyncHandler(topProductsController));
analyticsRouter.get('/order-status', authMiddleware, validate(commonAnalyticsQuerySchema, 'query'), asyncHandler(orderStatusController));
analyticsRouter.get('/payment-methods', authMiddleware, validate(commonAnalyticsQuerySchema, 'query'), asyncHandler(paymentMethodsController));
analyticsRouter.get('/customer-growth', authMiddleware, validate(customerGrowthQuerySchema, 'query'), asyncHandler(customerGrowthController));
analyticsRouter.get('/customer-regions', authMiddleware, validate(commonAnalyticsQuerySchema, 'query'), asyncHandler(customerRegionsController));
analyticsRouter.get('/customer-levels', authMiddleware, validate(commonAnalyticsQuerySchema, 'query'), asyncHandler(customerLevelsController));
analyticsRouter.get('/inventory-alerts', authMiddleware, validate(commonAnalyticsQuerySchema, 'query'), asyncHandler(inventoryAlertsController));
