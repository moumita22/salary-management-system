import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError, formatErrorResponse, type AuthSessionUser } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthSessionUser;
}

/**
 * Middleware enforcing valid Bearer Token authentication
 */
export function authenticateBearer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const { status, body } = formatErrorResponse(
      new AppError('Authentication required. Please provide a valid Bearer token.', 401, 'UnauthorizedError'),
      401,
      'UnauthorizedError'
    );
    res.status(status).json(body);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const user = authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error: unknown) {
    const { status, body } = formatErrorResponse(error, 401, 'UnauthorizedError');
    res.status(status).json(body);
  }
}
