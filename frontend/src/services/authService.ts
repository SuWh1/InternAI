import api from '../lib/axios';
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
      
      const { user, token } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', token);
      
      // Update store
      setUser(user);
    } catch (error: any) {
      setError(error.message || 'Login failed');
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
      
      const { user, token } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', token);
      
      // Update store
      setUser(user);
      
      // Note: Onboarding redirect will be handled by OnboardingWrapper
    } catch (error: any) {
      setError(error.message || 'Registration failed');
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

      const { user, token: accessToken } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', accessToken);
      
      // Update store
      setUser(user);
    } catch (error: any) {
      console.error('Google login API error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to authenticate with server';
      setError(`Google sign-in failed: ${errorMessage}`);
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
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
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