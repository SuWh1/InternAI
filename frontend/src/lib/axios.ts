import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api';
import { TIMEOUTS } from '../utils/constants';

// Extend axios config to include retry flag
interface AxiosRequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: TIMEOUTS.API_REQUEST,
  withCredentials: true, // Send cookies with requests
});

// Create a separate, clean axios instance for auth requests to avoid interceptor loops
export const authApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: TIMEOUTS.API_REQUEST,
  withCredentials: true, // Send cookies with requests
});

// Request interceptor (removed auth token handling - using cookies now)
api.interceptors.request.use(
  (config) => {
    // No need to add Authorization header - cookies are sent automatically
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
    
    // Handle 401 errors with cookie-based token refresh (but not for refresh endpoint itself)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token (cookies are sent automatically)
        const { authService } = await import('../services/authService');
        await authService.refreshTokens();
        
        // Retry the original request (cookies will be automatically included)
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.getState().logout();
        
        // To prevent further actions on this error, we return a resolved promise
        return new Promise(() => {});
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