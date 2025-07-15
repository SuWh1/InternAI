import api from '../lib/axios';
import { queryClient } from '../lib/queryClient';
import { authApi } from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types/api';

class AuthService {
  private initializationPromise: Promise<User | null> | null = null;
  
  private getStore() {
    return useAuthStore.getState();
  }

  async login(email: string, password: string): Promise<void> {
    const { setLoading, setError, setUser } = this.getStore();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<User>('/auth/login', {
        email,
        password,
      });
      
      const user = response.data;
      
      // Clear any previous user's data
      queryClient.clear();
      // Update store (tokens are now stored in httpOnly cookies)
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
    const { setLoading, setError } = this.getStore();
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post<{message: string; success: boolean}>('/auth/register', {
        email,
        password,
        name,
      });
      
      // Registration successful, but user needs to verify email
      // No user data is returned, just success message
      
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

  async verifyPin(email: string, code: string): Promise<void> {
    const { setLoading, setError, setUser } = this.getStore();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post<User>('/auth/verify-pin', {
        email,
        code,
      });
      
      const user = response.data;
      
      // Clear any previous user's data
      queryClient.clear();
      // Update store (tokens are now stored in httpOnly cookies)
      setUser(user);
      
      // Note: Onboarding redirect will be handled by OnboardingWrapper
    } catch (error: any) {
      // Parse error and provide specific message
      let errorMessage = 'Verification failed';
      
      if (error.statusCode === 400) {
        errorMessage = 'Invalid or expired verification code';
      } else if (error.statusCode === 404) {
        errorMessage = 'User not found';
      } else if (error.statusCode === 429) {
        errorMessage = 'Too many verification attempts. Please try again later';
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

  async resendPin(email: string): Promise<void> {
    const { setLoading, setError } = this.getStore();
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post<{message: string; success: boolean}>('/auth/resend-pin', {
        email,
      });
      
      // Success message will be handled by the UI
      
    } catch (error: any) {
      // Parse error and provide specific message
      let errorMessage = 'Failed to resend verification code';
      
      if (error.statusCode === 400) {
        errorMessage = 'User is already verified';
      } else if (error.statusCode === 404) {
        errorMessage = 'User not found';
      } else if (error.statusCode === 429) {
        errorMessage = 'Too many resend attempts. Please try again later';
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
      const response = await api.post<User>('/auth/google', {
        token: token,
      });

      const user = response.data;
      
      // Clear any previous user's data
      queryClient.clear();
      // Update store (tokens are now stored in httpOnly cookies)
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
    } finally {
      queryClient.clear();
      storeLogout();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      if (error.statusCode === 401) {
        return null;
      }
      throw error;
    }
  }

  async refreshTokens(): Promise<void> {
    const { setLoading, setError, setUser, logout: storeLogout } = this.getStore();

    try {
      setLoading(true);
      setError(null);

      // Attempt to refresh tokens using the refresh token cookie (httpOnly)
      // The backend will automatically send new access and refresh cookies
      await authApi.post('/auth/refresh');
      // Re-fetch user data to update the store with the latest info and ensure isAuthenticated is correct
      const user = await this.getCurrentUser();
      setUser(user);
    } catch (error: any) {
      console.error('[AuthService] Token refresh failed:', error);
      setError('Session expired. Please log in again.');
      storeLogout(); // Ensure user is logged out in store
      throw error; // Re-throw to propagate error to calling interceptor
    } finally {
      setLoading(false);
    }
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

  async initializeAuth(): Promise<User | null> {
    // Ensure only one initialization is running at a time
    if (this.initializationPromise) {
      return this.initializationPromise as Promise<User | null>;
    }

    let user: User | null = null;

    // Wrap the initialization logic in a promise
    this.initializationPromise = (async () => {
      try {
        user = await this.getCurrentUser();
      } catch (error) {
        console.error('[AuthService] Auth initialization error:', error);
        user = null;
      } finally {
        this.initializationPromise = null;
      }
      return user;
    })();

    return this.initializationPromise as Promise<User | null>;
  }
}



// Create and export a singleton instance
export const authService = new AuthService(); 