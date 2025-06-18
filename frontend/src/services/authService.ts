import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponse, User } from '../types/api';



class AuthService {
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

  async initializeAuth(): Promise<void> {
    const { setLoading, setUser } = this.getStore();
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const user = await this.getCurrentUser();
      setUser(user);
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
}



// Create and export a singleton instance
export const authService = new AuthService(); 