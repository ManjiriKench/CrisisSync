// ============================================================
// Auth Store — Zustand state for authentication
// ============================================================

import { create } from 'zustand';
import { auth as authAPI, setAuthToken } from '../services/api.js';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('crisissync_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('crisissync_token'),
  isLoading: false,
  error: null,

  login: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.loginAsRole(role);
      setAuthToken(response.accessToken);
      localStorage.setItem('crisissync_user', JSON.stringify(response.user));
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  loginWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      setAuthToken(response.accessToken);
      localStorage.setItem('crisissync_user', JSON.stringify(response.user));
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('crisissync_user');
    localStorage.removeItem('crisissync_token');
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
