import { z } from 'zod';
import { safeString } from './safeString.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: safeString(1, 100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
