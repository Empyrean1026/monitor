export type UserRole = 'ADMIN' | 'ANALYST';

export type AuthUser = { id: string; email: string; name: string; role: UserRole };

export type LoginPayload = { email: string; password: string };

export type LoginResult = { accessToken: string; expiresAt: string; expiresIn: number; user: AuthUser };
