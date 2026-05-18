import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  WS_PORT: z.coerce.number().default(8080),
  BCRYPT_ROUNDS: z.coerce.number().min(4).max(15).default(10),
  /** all — локально; api / ws — два сервиса на Render (один порт на инстанс). */
  SERVICE_MODE: z.enum(['all', 'api', 'ws']).default('all'),
  /** Через запятую, например https://syllanote.onrender.com */
  CORS_ORIGINS: z.string().optional(),
  /** Если задан — доступен POST /api/dev/seed (заголовок X-Seed-Secret). Только для syllanote-api. */
  SEED_SECRET: z.string().min(16).optional(),
});

export const env = envSchema.parse(process.env);
