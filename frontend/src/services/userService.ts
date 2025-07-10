import api from '../lib/axios';
import type { User, UserUpdate, PasswordChange, AccountDeletion } from '../types/api';

class UserService {
  
  async updateProfile(data: UserUpdate): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  }

  async changePassword(data: PasswordChange): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/change-password', data);
    return response.data;
  }

  async deleteAccount(data: AccountDeletion): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>('/auth/account', { data });
    return response.data;
  }

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file); // backend expects 'file' field
    
    const response = await api.post<{ url: string }>('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

// Create and export a singleton instance
export const userService = new UserService(); 