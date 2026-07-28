import { http } from './http';
import type { ApiResponse } from '../types/api';
import type { AuthUser, LoginPayload, LoginResult } from '../types/auth';

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await http.post<ApiResponse<LoginResult>>('/auth/login', payload);
  return data.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await http.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}

export async function logoutRequest(): Promise<void> {
  await http.post('/auth/logout');
}
