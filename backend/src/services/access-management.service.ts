import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import type { ApiRole } from '../types/express.js';
import { apiToRole, roleToApi } from '../types/express.js';
import { AppError } from '../types/errors.js';
import { accessService } from './access.service.js';

export const accessManagementService = {
  async listMembers(userId: string, noteId: string) {
    await accessService.requireAction(userId, noteId, 'read');

    const members = await prisma.accessRight.findMany({
      where: { noteId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return members.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: roleToApi(m.role),
    }));
  },

  async invite(
    userId: string,
    input: { noteId: string; email: string; role: ApiRole },
  ) {
    await accessService.requireAction(userId, input.noteId, 'manage_access');

    if (input.role === 'owner') {
      throw new AppError(400, 'Cannot assign owner role via invite');
    }

    const targetUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (!targetUser) {
      throw new AppError(404, 'User with this email not found');
    }

    const existing = await prisma.accessRight.findUnique({
      where: {
        userId_noteId: { userId: targetUser.id, noteId: input.noteId },
      },
    });
    if (existing) {
      throw new AppError(409, 'User already has access to this note');
    }

    const access = await prisma.accessRight.create({
      data: {
        userId: targetUser.id,
        noteId: input.noteId,
        role: apiToRole(input.role),
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return {
      userId: access.user.id,
      email: access.user.email,
      name: access.user.name,
      role: roleToApi(access.role),
    };
  },

  async updateRole(
    userId: string,
    noteId: string,
    targetUserId: string,
    role: ApiRole,
  ) {
    await accessService.requireAction(userId, noteId, 'manage_access');

    if (role === 'owner') {
      throw new AppError(400, 'Use transfer ownership flow to change owner');
    }

    const existing = await prisma.accessRight.findUnique({
      where: { userId_noteId: { userId: targetUserId, noteId } },
    });
    if (!existing) {
      throw new AppError(404, 'Access record not found');
    }
    if (existing.role === Role.OWNER) {
      throw new AppError(400, 'Cannot change owner role');
    }

    const updated = await prisma.accessRight.update({
      where: { userId_noteId: { userId: targetUserId, noteId } },
      data: { role: apiToRole(role) },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return {
      userId: updated.user.id,
      email: updated.user.email,
      name: updated.user.name,
      role: roleToApi(updated.role),
    };
  },

  async removeMember(userId: string, noteId: string, targetUserId: string) {
    await accessService.requireAction(userId, noteId, 'manage_access');

    const existing = await prisma.accessRight.findUnique({
      where: { userId_noteId: { userId: targetUserId, noteId } },
    });
    if (!existing) {
      throw new AppError(404, 'Access record not found');
    }
    if (existing.role === Role.OWNER) {
      throw new AppError(400, 'Cannot remove the owner');
    }

    await prisma.accessRight.delete({
      where: { userId_noteId: { userId: targetUserId, noteId } },
    });
  },
};
