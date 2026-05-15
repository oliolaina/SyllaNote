import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validateRequest({ body: registerSchema }),
  authController.register,
);

authRoutes.post('/login', validateRequest({ body: loginSchema }), authController.login);

authRoutes.get('/me', authMiddleware, authController.me);
