// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  profile_picture?: string;
  google_id?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface GoogleAuthRequest {
  token: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
} 