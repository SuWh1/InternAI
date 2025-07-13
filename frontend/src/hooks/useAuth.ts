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

  // Auth initialization is now handled globally in App.tsx
  // No need to initialize on every hook call

  const login = async (email: string, password: string) => {
    clearError();
    await authService.login(email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    clearError();
    await authService.register(email, password, name);
  };

  const verifyPin = async (email: string, code: string) => {
    clearError();
    await authService.verifyPin(email, code);
  };

  const resendPin = async (email: string) => {
    clearError();
    await authService.resendPin(email);
  };

  const googleLoginWithToken = async (token: string) => {
    clearError();
    await authService.googleLoginWithToken(token);
  };

  const logout = async () => {
    clearError();
    await authService.logout();
  };

  const refreshUserData = async () => {
    clearError();
    await authService.refreshUserData();
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    clearError,
    login,
    register,
    verifyPin,
    resendPin,
    googleLoginWithToken,
    logout,
    refreshUserData,
  };
}; 