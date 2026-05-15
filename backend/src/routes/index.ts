import { Router } from 'express';
import { accessRoutes } from './access.routes.js';
import { authRoutes } from './auth.routes.js';
import { commentRoutes } from './comment.routes.js';
import { noteRoutes } from './note.routes.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/notes', noteRoutes);
apiRoutes.use('/access', accessRoutes);
apiRoutes.use('/comments', commentRoutes);
