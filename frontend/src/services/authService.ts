import api from '../lib/axios';
import { authApi } from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponse, User } from '../types/api';

class AuthService {
  private initializationPromise: Promise<void> | null = null;
  
  private getStore() {
    return useAuthStore.getState();
  }

  async login(email: string, password: string): Promise<void> {
    const { setLoading, setError, setUser } = this.getStore();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      
      const { user, token, refresh_token } = response.data;
      
      // Store tokens
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Update store
      setUser(user);
    } catch (error: any) {
      // Parse error and provide specific message
      let errorMessage = 'Login failed';
      
      if (error.statusCode === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.statusCode === 404) {
        errorMessage = 'Account not found';
      } else if (error.statusCode === 403) {
        errorMessage = 'Account is disabled or suspended';
      } else if (error.statusCode === 429) {
        errorMessage = 'Too many login attempts. Please try again later';
      } else if (error.statusCode >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const { setLoading, setError, setUser } = this.getStore();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
      });
      
      const { user, token, refresh_token } = response.data;
      
      // Store tokens
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Update store
      setUser(user);
      
      // Note: Onboarding redirect will be handled by OnboardingWrapper
    } catch (error: any) {
      // Parse error and provide specific message
      let errorMessage = 'Registration failed';
      
      // Check error message content for existing account (regardless of status code)
      const errorText = (error.error || error.message || '').toLowerCase();
      
      if (error.statusCode === 409 || 
          errorText.includes('already exists') || 
          errorText.includes('already registered') ||
          errorText.includes('email already') ||
          errorText.includes('user already exists')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.statusCode === 400) {
        errorMessage = 'Invalid registration data. Please check your information';
      } else if (error.statusCode === 422) {
        errorMessage = 'Invalid email format or password requirements not met';
      } else if (error.statusCode === 429) {
        errorMessage = 'Too many registration attempts. Please try again later';
      } else if (error.statusCode >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async googleLoginWithToken(token: string): Promise<void> {
    const { setLoading, setError, setUser } = this.getStore();
    
    try {
      setLoading(true);
      setError(null);

      // Send the ID token to your backend
      const response = await api.post<AuthResponse>('/auth/google', {
        token: token,
      });

      const { user, token: accessToken, refresh_token } = response.data;
      
      // Store tokens
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Update store
      setUser(user);
    } catch (error: any) {
      console.error('Google login API error:', error);
      
      // Parse error and provide specific message
      let errorMessage = 'Google sign-in failed';
      
      if (error.statusCode === 401) {
        errorMessage = 'Google authentication failed. Please try again';
      } else if (error.statusCode === 409) {
        errorMessage = 'An account with this Google email already exists with a different sign-in method';
      } else if (error.statusCode === 400) {
        errorMessage = 'Invalid Google token. Please try signing in again';
      } else if (error.statusCode >= 500) {
        errorMessage = 'Server error during Google sign-in. Please try again later';
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = `Google sign-in failed: ${error.error}`;
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = `Google sign-in failed: ${error.message}`;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }



  async logout(): Promise<void> {
    const { logout: storeLogout } = this.getStore();
    
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      storeLogout();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  async refreshTokens(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApi.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    const { user, token, refresh_token: newRefreshToken } = response.data;
    
    // Store new tokens
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', newRefreshToken);
    
    // Update store
    const { setUser } = this.getStore();
    setUser(user);
  }

  async refreshUserData(): Promise<void> {
    const { setUser } = this.getStore();
    
    try {
      // Don't set loading for internal refresh - this was causing infinite loops
      const user = await this.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  }

  async initializeAuth(): Promise<void> {
    // Prevent multiple simultaneous initialization calls
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const { setLoading, setUser, isAuthenticated, user } = this.getStore();
    
    // If already authenticated with user data, no need to re-initialize
    if (isAuthenticated && user) {
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    this.initializationPromise = (async () => {
      try {
        setLoading(true);
        // Always fetch fresh user data on app initialization
        const user = await this.getCurrentUser();
        setUser(user);
      } catch (error) {
        // Tokens are invalid, clear them
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    try {
      await this.initializationPromise;
    } finally {
      // Reset the promise so future calls can run
      this.initializationPromise = null;
    }
  }
}



// Create and export a singleton instance
export const authService = new AuthService(); 