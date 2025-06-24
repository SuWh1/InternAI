import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { ApiError } from '../types/api';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<{ error?: string; message?: string }>) => {
    // Handle 401 errors by clearing token
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // You can dispatch a logout action here if needed
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