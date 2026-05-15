import { Router } from 'express';
import { noteController } from '../controllers/note.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createNoteSchema,
  noteIdParamSchema,
  updateNoteSchema,
} from '../validators/note.validators.js';

export const noteRoutes = Router();

noteRoutes.use(authMiddleware);

noteRoutes.post('/', validateRequest({ body: createNoteSchema }), noteController.create);
noteRoutes.get('/', noteController.list);
noteRoutes.get('/:id', validateRequest({ params: noteIdParamSchema }), noteController.getById);
noteRoutes.patch(
  '/:id',
  validateRequest({ params: noteIdParamSchema, body: updateNoteSchema }),
  noteController.update,
);
noteRoutes.delete(
  '/:id',
  validateRequest({ params: noteIdParamSchema }),
  noteController.delete,
);
