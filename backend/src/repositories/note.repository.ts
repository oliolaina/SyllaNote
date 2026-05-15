import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const noteRepository = {
  createWithOwner(data: {
    title: string;
    contentJson?: Prisma.InputJsonValue;
    ownerId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title: data.title,
          contentJson: data.contentJson ?? {},
          ownerId: data.ownerId,
          accessRights: {
            create: { userId: data.ownerId, role: 'OWNER' },
          },
          blocks: {
            create: { type: 'text', order: 0, content: {} },
          },
        },
        include: {
          blocks: { orderBy: { order: 'asc' } },
          accessRights: true,
          owner: { select: { id: true, email: true, name: true } },
        },
      });
      return note;
    });
  },

  findAccessibleByUser(userId: string) {
    return prisma.note.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { accessRights: { some: { userId } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        accessRights: { where: { userId } },
      },
    });
  },

  findById(noteId: string) {
    return prisma.note.findUnique({
      where: { id: noteId },
      include: {
        blocks: { orderBy: { order: 'asc' } },
        accessRights: true,
        owner: { select: { id: true, email: true, name: true } },
      },
    });
  },

  update(noteId: string, data: { title?: string; contentJson?: Prisma.InputJsonValue }) {
    return prisma.note.update({
      where: { id: noteId },
      data,
      include: {
        blocks: { orderBy: { order: 'asc' } },
      },
    });
  },

  delete(noteId: string) {
    return prisma.note.delete({ where: { id: noteId } });
  },

  updateContentJson(noteId: string, contentJson: Prisma.InputJsonValue) {
    return prisma.note.update({
      where: { id: noteId },
      data: { contentJson },
    });
  },
};
