import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/errors.js';
import { accessService } from './access.service.js';

export const commentService = {
  async list(userId: string, noteId: string) {
    await accessService.requireAction(userId, noteId, 'read');

    const comments = await prisma.comment.findMany({
      where: { noteId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      noteId: c.noteId,
      blockId: c.blockId,
      createdAt: c.createdAt,
      author: c.user,
    }));
  },

  async create(
    userId: string,
    input: { noteId: string; blockId?: string; text: string },
  ) {
    await accessService.requireAction(userId, input.noteId, 'comment');

    if (input.blockId) {
      const block = await prisma.block.findFirst({
        where: { id: input.blockId, noteId: input.noteId },
      });
      if (!block) {
        throw new AppError(400, 'Block does not belong to this note');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        text: input.text,
        userId,
        noteId: input.noteId,
        blockId: input.blockId,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return {
      id: comment.id,
      text: comment.text,
      noteId: comment.noteId,
      blockId: comment.blockId,
      createdAt: comment.createdAt,
      author: comment.user,
    };
  },
};
