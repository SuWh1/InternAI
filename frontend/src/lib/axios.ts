import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api';

// Extend axios config to include retry flag
interface AxiosRequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for comprehensive AI content generation
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;
    
    // Handle 401 errors with token refresh (but not for refresh endpoint itself)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Try to refresh the token
          const { authService } = await import('../services/authService');
          await authService.refreshTokens();
          
          // Retry the original request with the new token
          const newToken = localStorage.getItem('auth_token');
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          
          // Clear user state
          const { useAuthStore } = await import('../stores/authStore');
          useAuthStore.getState().logout();
        }
      } else {
        // No refresh token, clear access token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        
        // Clear user state
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.getState().logout();
      }
    }

    // Transform error to match our ApiError interface
    const apiError: ApiError = {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error',
      message: error.response?.data?.message || 'Failed to communicate with server',
      statusCode: error.response?.status || 500
    };

    return Promise.reject(apiError);
  }
);

export default api; 