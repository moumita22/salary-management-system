import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse } from '../types/index.js';

/**
 * Global 404 Handler for undefined API routes
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    statusCode: 404,
    code: 'NotFound',
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global Error Handler middleware for unhandled exceptions
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const code = (err as { name?: string })?.name || 'ServerError';
  const message = (err as { message?: string })?.message || 'An unexpected error occurred';
  console.error(`[Global Error] ${code}:`, message);

  const { status, body } = formatErrorResponse(err, 500, 'ServerError');
  res.status(status).json(body);
}
