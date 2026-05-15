import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { User } from '../types/api';

const TOKEN_KEY = 'syllanote_token';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    const token = get().token ?? localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    set({ token, isLoading: true });
    try {
      const { data: user } = await authService.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      get().logout();
    }
  },
}));
