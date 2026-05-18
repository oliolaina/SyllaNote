import { Router } from 'express';
import { env } from '../config/env.js';
import { accessRoutes } from './access.routes.js';
import { authRoutes } from './auth.routes.js';
import { commentRoutes } from './comment.routes.js';
import { devRoutes } from './dev.routes.js';
import { noteRoutes } from './note.routes.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/notes', noteRoutes);
apiRoutes.use('/access', accessRoutes);
apiRoutes.use('/comments', commentRoutes);

if (env.SEED_SECRET) {
  apiRoutes.use('/dev', devRoutes);
}
