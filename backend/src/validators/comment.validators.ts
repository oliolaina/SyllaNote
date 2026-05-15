import { z } from 'zod';

export const createCommentSchema = z.object({
  noteId: z.string().uuid(),
  blockId: z.string().uuid().optional(),
  text: z.string().min(1).max(5000),
});

export const noteIdParamSchema = z.object({
  noteId: z.string().uuid(),
});
