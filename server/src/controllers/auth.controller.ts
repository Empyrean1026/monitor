import type { Request, Response } from 'express';

import { login } from '../services/auth.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type { LoginInput } from '../validators/auth.validator.js';

export async function loginController(request: Request, response: Response): Promise<Response> {
  const result = await login(request.body as LoginInput);
  return sendSuccess(response, result, 'Login successful');
}

export function meController(request: Request, response: Response): Response {
  return sendSuccess(response, request.authUser!, 'success');
}

export function logoutController(_request: Request, response: Response): Response {
  return sendSuccess(response, {}, 'Logout successful');
}
