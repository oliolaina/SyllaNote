import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  WS_PORT: z.coerce.number().default(8080),
  BCRYPT_ROUNDS: z.coerce.number().min(4).max(15).default(10),
});

export const env = envSchema.parse(process.env);
