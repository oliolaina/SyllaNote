import { Router } from 'express';
import { env } from '../config/env.js';
import { runSeedDatabase } from '../seed/seedDatabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const devRoutes = Router();

/** Одноразовый seed для Render Free (без Shell). Требует заголовок X-Seed-Secret. */
devRoutes.post(
  '/seed',
  asyncHandler(async (req, res) => {
    const secret = req.headers['x-seed-secret'];
    if (!env.SEED_SECRET || typeof secret !== 'string' || secret !== env.SEED_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await runSeedDatabase();
    res.json({
      ok: true,
      message: 'Seed completed',
      ...result,
    });
  }),
);
