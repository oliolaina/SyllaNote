import { z } from 'zod';
import { safeString } from './safeString.js';

export const createCommentSchema = z.object({
  noteId: z.string().uuid(),
  blockId: z.string().uuid().optional(),
  text: safeString(1, 5000),
});

export const noteIdParamSchema = z.object({
  noteId: z.string().uuid(),
});
