import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  contentJson: z.record(z.unknown()).optional(),
});

export const updateNoteSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    contentJson: z.record(z.unknown()).optional(),
  })
  .refine((data) => data.title !== undefined || data.contentJson !== undefined, {
    message: 'At least one of title or contentJson is required',
  });

export const noteIdParamSchema = z.object({
  id: z.string().uuid(),
});
