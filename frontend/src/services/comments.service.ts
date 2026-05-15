import type { Comment } from '../types/api';
import { api } from './api';

export const commentsService = {
  list(noteId: string) {
    return api.get<Comment[]>(`/comments/${noteId}`);
  },

  create(data: { noteId: string; blockId?: string; text: string }) {
    return api.post<Comment>('/comments', data);
  },
};
