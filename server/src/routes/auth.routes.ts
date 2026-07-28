import { Router } from 'express';

import { loginController, logoutController, meController } from '../controllers/auth.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';
import { loginRateLimit } from '../middlewares/login-rate-limit.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginSchema } from '../validators/auth.validator.js';
import { validate } from '../middlewares/validate.js';
import { UserRole } from '../../generated/prisma/client';

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, validate(loginSchema), asyncHandler(loginController));
authRouter.get('/me', authMiddleware, meController);
authRouter.post('/logout', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.ANALYST), logoutController);
