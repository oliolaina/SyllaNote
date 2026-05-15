import { Router } from 'express';
import { commentController } from '../controllers/comment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createCommentSchema,
  noteIdParamSchema,
} from '../validators/comment.validators.js';

export const commentRoutes = Router();

commentRoutes.use(authMiddleware);

commentRoutes.get(
  '/:noteId',
  validateRequest({ params: noteIdParamSchema }),
  commentController.list,
);

commentRoutes.post('/', validateRequest({ body: createCommentSchema }), commentController.create);
