import { Router } from 'express';

import { analyticsRouter, dashboardRouter } from './analytics.routes.js';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import { orderRouter } from './order.routes.js';
import { productRouter } from './product.routes.js';
import { customerRouter } from './customer.routes.js';
import { exportRouter } from './export.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/exports', exportRouter);
