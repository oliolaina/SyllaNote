import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/jwt.service.js';
import { AppError } from '../types/errors.js';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}
