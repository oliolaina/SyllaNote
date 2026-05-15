import type { AccessMember, AssignableRole } from '../types/api';
import { api } from './api';

export const accessService = {
  list(noteId: string) {
    return api.get<AccessMember[]>(`/access/${noteId}`);
  },

  invite(data: { noteId: string; email: string; role: AssignableRole }) {
    return api.post<AccessMember>('/access/invite', data);
  },

  updateRole(noteId: string, userId: string, role: AssignableRole) {
    return api.patch<AccessMember>(`/access/${noteId}/${userId}`, { role });
  },

  remove(noteId: string, userId: string) {
    return api.delete(`/access/${noteId}/${userId}`);
  },
};
