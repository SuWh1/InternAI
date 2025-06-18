import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    clearError,
  } = useAuthStore();

  // Initialize auth on first use
  useEffect(() => {
    authService.initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    clearError();
    await authService.login(email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    clearError();
    await authService.register(email, password, name);
  };

  const googleLoginWithToken = async (token: string) => {
    clearError();
    await authService.googleLoginWithToken(token);
  };

  const logout = async () => {
    clearError();
    await authService.logout();
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    googleLoginWithToken,
    logout,
  };
}; 