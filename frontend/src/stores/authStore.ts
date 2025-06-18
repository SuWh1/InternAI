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
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        loading: false,
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
          localStorage.removeItem('auth_token');
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
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated 
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
); 