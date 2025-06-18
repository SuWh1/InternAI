import api from '../lib/axios';

class ApiService {
  // General GET request
  async get<T>(endpoint: string): Promise<T> {
    const response = await api.get<T>(endpoint);
    return response.data;
  }

  // General POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.post<T>(endpoint, data);
    return response.data;
  }

  // General PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.put<T>(endpoint, data);
    return response.data;
  }

  // General DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    const response = await api.delete<T>(endpoint);
    return response.data;
  }

  // General PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.patch<T>(endpoint, data);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService; 