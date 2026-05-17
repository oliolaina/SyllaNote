import type { Prisma } from '@prisma/client';
import { accessService } from './access.service.js';
import { noteRepository } from '../repositories/note.repository.js';
import { roleToApi } from '../types/roles.js';
import { AppError } from '../types/errors.js';

function mapNoteListItem(
  note: Awaited<ReturnType<typeof noteRepository.findAccessibleByUser>>[number],
  userId: string,
) {
  const myAccess = note.accessRights[0];
  return {
    id: note.id,
    title: note.title,
    ownerId: note.ownerId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    myRole: myAccess ? roleToApi(myAccess.role) : null,
  };
}

function mapNoteDetail(
  note: NonNullable<Awaited<ReturnType<typeof noteRepository.findById>>>,
  myRole: ReturnType<typeof roleToApi>,
) {
  return {
    id: note.id,
    title: note.title,
    contentJson: note.contentJson,
    ownerId: note.ownerId,
    owner: note.owner,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    blocks: note.blocks,
    myRole,
  };
}

export const noteService = {
  async create(
    userId: string,
    input: { title: string; contentJson?: Prisma.InputJsonValue },
  ) {
    const note = await noteRepository.createWithOwner({
      title: input.title,
      contentJson: input.contentJson,
      ownerId: userId,
    });
    return mapNoteDetail(note, 'owner');
  },

  async list(userId: string) {
    const notes = await noteRepository.findAccessibleByUser(userId);
    return notes.map((n) => mapNoteListItem(n, userId));
  },

  async getById(userId: string, noteId: string) {
    await accessService.requireAction(userId, noteId, 'read');
    const note = await noteRepository.findById(noteId);
    if (!note) {
      throw new AppError(404, 'Note not found');
    }
    const myRole = await accessService.getMyRole(userId, noteId);
    return mapNoteDetail(note, myRole!);
  },

  async update(
    userId: string,
    noteId: string,
    input: { title?: string; contentJson?: Prisma.InputJsonValue },
  ) {
    await accessService.requireAction(userId, noteId, 'edit');
    const note = await noteRepository.update(noteId, input);
    const myRole = await accessService.getMyRole(userId, noteId);
    return {
      id: note.id,
      title: note.title,
      contentJson: note.contentJson,
      updatedAt: note.updatedAt,
      myRole,
    };
  },

  async delete(userId: string, noteId: string) {
    await accessService.requireAction(userId, noteId, 'delete');
    await noteRepository.delete(noteId);
  },
};
