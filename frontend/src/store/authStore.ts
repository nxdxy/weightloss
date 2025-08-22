import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, authApi, usersApi } from '../lib/api';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateApiKey: (apiKey: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ username, password });
          const { access_token } = response.data;
          
          // Store token
          localStorage.setItem('token', access_token);
          
          // Load user profile
          await get().loadUser();
          
          set({ isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          const user = response.data;
          
          // Auto-login after registration
          await get().login(data.username, data.password);
          
          set({ user, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
      },

      loadUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          const user = response.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          // Token might be expired
          localStorage.removeItem('access_token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Session expired. Please login again.'
          });
        }
      },

      updateProfile: async (data: Partial<UserProfile>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await usersApi.updateProfile(data);
          const updatedUser = response.data;
          
          set({
            user: updatedUser,
            isLoading: false
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Profile update failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      updateApiKey: async (apiKey: string) => {
        set({ isLoading: true, error: null });
        try {
          await usersApi.updateApiKey(apiKey);
          
          // Update user object to reflect API key is set
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser },
              isLoading: false
            });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'API key update failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
