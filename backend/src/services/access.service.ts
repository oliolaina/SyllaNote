import type { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import type { AccessAction, ApiRole } from '../types/express.js';
import { roleToApi } from '../types/express.js';
import { AppError } from '../types/errors.js';

const rolePermissions: Record<Role, Set<AccessAction>> = {
  OWNER: new Set(['read', 'edit', 'delete', 'manage_access', 'comment', 'websocket_edit']),
  EDITOR: new Set(['read', 'edit', 'comment', 'websocket_edit']),
  COMMENTATOR: new Set(['read', 'comment']),
  READER: new Set(['read']),
};

export const accessService = {
  async getUserRole(userId: string, noteId: string): Promise<Role | null> {
    const access = await prisma.accessRight.findUnique({
      where: { userId_noteId: { userId, noteId } },
    });
    return access?.role ?? null;
  },

  async requireAction(userId: string, noteId: string, action: AccessAction): Promise<Role> {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true },
    });
    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    const role = await this.getUserRole(userId, noteId);
    if (!role || !rolePermissions[role].has(action)) {
      throw new AppError(403, 'Insufficient permissions');
    }
    return role;
  },

  async getMyRole(userId: string, noteId: string): Promise<ApiRole | null> {
    const role = await this.getUserRole(userId, noteId);
    return role ? roleToApi(role) : null;
  },
};
