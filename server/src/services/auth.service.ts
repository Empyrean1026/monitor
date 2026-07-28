import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { UserRole } from '../../generated/prisma/client';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type { LoginInput } from '../validators/auth.validator.js';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type LoginResult = {
  accessToken: string;
  expiresAt: string;
  expiresIn: number;
  user: AuthenticatedUser;
};

const authenticatedUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

function createAccessToken(user: AuthenticatedUser): LoginResult {
  const expiresIn = env.JWT_EXPIRES_IN_SECONDS;
  const accessToken = jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn,
  });

  return {
    accessToken,
    expiresIn,
    expiresAt: new Date(Date.now() + expiresIn * 1_000).toISOString(),
    user,
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { ...authenticatedUserSelect, passwordHash: true },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError('Invalid email or password', 401);
  }

  return createAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

export async function getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: authenticatedUserSelect });
  if (!user) throw new AppError('Authentication required', 401);
  return user;
}

export async function authenticateAccessToken(token: string): Promise<AuthenticatedUser> {
  let payload: JwtPayload | string;

  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }

  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new AppError('Invalid access token', 401);
  }

  return getAuthenticatedUser(payload.sub);
}
