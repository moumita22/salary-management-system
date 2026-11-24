import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { formatErrorResponse } from '../types/index.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error: unknown) {
    const { status, body } = formatErrorResponse(error, 401, 'AuthenticationError');
    res.status(status).json(body);
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, full_name } = req.body;
    const result = await authService.register({ username, password, full_name });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error: unknown) {
    const { status, body } = formatErrorResponse(error, 400, 'RegistrationError');
    res.status(status).json(body);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        code: 'UnauthorizedError',
        error: 'Missing or malformed Authorization header',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const user = authService.verifyToken(token);
    res.json({
      success: true,
      user,
    });
  } catch (error: unknown) {
    const { status, body } = formatErrorResponse(error, 401, 'UnauthorizedError');
    res.status(status).json(body);
  }
};
