import type { Response } from 'express';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors: unknown[];
};

export function sendSuccess<T>(response: Response, data: T, message = 'success', statusCode = 200): Response<ApiSuccess<T>> {
  return response.status(statusCode).json({ success: true, data, message });
}

export function sendFailure(
  response: Response,
  message: string,
  errors: unknown[] = [],
  statusCode = 500,
): Response<ApiFailure> {
  return response.status(statusCode).json({ success: false, message, errors });
}
