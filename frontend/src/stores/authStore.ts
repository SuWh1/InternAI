import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '../types/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - start with loading true to prevent flash
        user: null,
        isAuthenticated: false,
        loading: true,
        error: null,

        // Actions
        setUser: (user) => 
          set(
            { 
              user, 
              isAuthenticated: !!user,
              error: null 
            },
            false,
            'auth/setUser'
          ),

        setLoading: (loading) => 
          set(
            { loading },
            false,
            'auth/setLoading'
          ),

        setError: (error) => 
          set(
            { error, loading: false },
            false,
            'auth/setError'
          ),

        clearError: () => 
          set(
            { error: null },
            false,
            'auth/clearError'
          ),

        logout: () => {
          // Tokens are cleared on the backend via logout endpoint
          set(
            { 
              user: null, 
              isAuthenticated: false, 
              error: null,
              loading: false
            },
            false,
            'auth/logout'
          );
        },

        initialize: async () => {
          set({ loading: true, error: null }, false, 'auth/initialize');
          
          try {
            const { authService } = await import('../services/authService');
            const user = await authService.initializeAuth();
            
            if (user) {
              get().setUser(user);
            } else {
              get().setUser(null);
            }
          } catch (error) {
            console.error('Auth initialization failed:', error);
            get().setError('Failed to initialize authentication.');
          } finally {
            set({ loading: false }, false, 'auth/initialize-complete');
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          // Don't persist any sensitive user data
          // Only persist non-sensitive preferences if needed
        }),
        onRehydrateStorage: () => (state) => {
          // Always initialize auth from /me endpoint on app load
          if (state) {
            state.initialize();
          }
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
); 