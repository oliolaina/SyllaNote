import { z } from 'zod';

const assignableRoleSchema = z.enum(['editor', 'commentator', 'reader']);

export const inviteSchema = z.object({
  noteId: z.string().uuid(),
  email: z.string().email(),
  role: assignableRoleSchema,
});

export const noteIdParamSchema = z.object({
  noteId: z.string().uuid(),
});

export const accessMemberParamSchema = z.object({
  noteId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const updateRoleSchema = z.object({
  role: assignableRoleSchema,
});
