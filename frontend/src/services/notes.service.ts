import type { NoteDetail, NoteListItem } from '../types/api';
import { api } from './api';

export const notesService = {
  list() {
    return api.get<NoteListItem[]>('/notes');
  },

  get(id: string) {
    return api.get<NoteDetail>(`/notes/${id}`);
  },

  create(data: { title: string; contentJson?: Record<string, unknown> }) {
    return api.post<NoteDetail>('/notes', data);
  },

  update(id: string, data: { title?: string; contentJson?: Record<string, unknown> }) {
    return api.patch<NoteDetail>(`/notes/${id}`, data);
  },

  delete(id: string) {
    return api.delete(`/notes/${id}`);
  },
};
