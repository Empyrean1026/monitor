import type { NextFunction, Request, Response } from 'express';

import { UserRole } from '../../generated/prisma/client';
import { authenticateAccessToken } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';

export async function authMiddleware(request: Request, _response: Response, next: NextFunction): Promise<void> {
  const authorization = request.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    request.authUser = await authenticateAccessToken(authorization.slice('Bearer '.length));
    next();
  } catch (error) {
    next(error);
  }
}

export function roleMiddleware(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.authUser) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!roles.includes(request.authUser.role)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }

    next();
  };
}
