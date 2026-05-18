import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRoutes } from './routes/index.js';

function getCorsOrigins(): string[] {
  const local = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const extra =
    env.CORS_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return [...new Set([...local, ...extra])];
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (getCorsOrigins().includes(origin)) {
          callback(null, true);
          return;
        }
        try {
          const { hostname } = new URL(origin);
          if (hostname.endsWith('.onrender.com')) {
            callback(null, true);
            return;
          }
        } catch {
          /* ignore invalid origin */
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
    next(err);
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiRoutes);

  app.use(errorHandler);

  return app;
}
