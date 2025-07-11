// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  profile_picture?: string;
  google_id?: string;
  phone?: string;
  hashed_password?: string;
  has_completed_onboarding?: boolean;
  has_password?: boolean;
}

export interface UserUpdate {
  email?: string;
  name?: string;
  phone?: string;
  profile_picture?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface AccountDeletion {
  password: string;
  confirmation: string; // Must be "DELETE"
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
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