import type { AuthResponse, User } from '../types/api';
import { api } from './api';

export const authService = {
  register(data: { email: string; password: string; name?: string }) {
    return api.post<AuthResponse>('/auth/register', data);
  },

  login(data: { email: string; password: string }) {
    return api.post<AuthResponse>('/auth/login', data);
  },

  me() {
    return api.get<User>('/auth/me');
  },
};
