import { Router } from 'express';
import { accessController } from '../controllers/access.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  accessMemberParamSchema,
  inviteSchema,
  noteIdParamSchema,
  updateRoleSchema,
} from '../validators/access.validators.js';

export const accessRoutes = Router();

accessRoutes.use(authMiddleware);

accessRoutes.get(
  '/:noteId',
  validateRequest({ params: noteIdParamSchema }),
  accessController.list,
);

accessRoutes.post('/invite', validateRequest({ body: inviteSchema }), accessController.invite);

accessRoutes.patch(
  '/:noteId/:userId',
  validateRequest({ params: accessMemberParamSchema, body: updateRoleSchema }),
  accessController.updateRole,
);

accessRoutes.delete(
  '/:noteId/:userId',
  validateRequest({ params: accessMemberParamSchema }),
  accessController.remove,
);
