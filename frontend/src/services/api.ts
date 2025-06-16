import type {
  ApiResponse,
  ApiError,
  OnboardingAnswers,
  OnboardingQuestion,
  Roadmap,
  Task,
  UpdateTaskRequest,
  UserStats,
  Feedback,
  CreateFeedbackRequest,
  ChecklistItem,
  UpdateChecklistItemRequest,
  AuthResponse,
  User
} from '../types/api';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        success: false,
        error: 'Network error',
        message: 'Failed to communicate with server',
        statusCode: response.status
      }));
      throw errorData;
    }

    const data: ApiResponse<T> = await response.json();
    return data.data;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const authData = await this.handleResponse<AuthResponse>(response);
    this.setToken(authData.token);
    return authData;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, name }),
    });

    const authData = await this.handleResponse<AuthResponse>(response);
    this.setToken(authData.token);
    return authData;
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    this.clearToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  // Onboarding
  async getOnboardingQuestions(): Promise<OnboardingQuestion[]> {
    const response = await fetch(`${this.baseURL}/onboarding/questions`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<OnboardingQuestion[]>(response);
  }

  async submitOnboarding(answers: OnboardingAnswers): Promise<Roadmap> {
    const response = await fetch(`${this.baseURL}/onboarding/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ answers }),
    });
    return this.handleResponse<Roadmap>(response);
  }

  // Roadmap
  async getRoadmap(): Promise<Roadmap> {
    const response = await fetch(`${this.baseURL}/roadmap`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Roadmap>(response);
  }

  async updateChecklistItem(itemId: string, data: UpdateChecklistItemRequest): Promise<ChecklistItem> {
    const response = await fetch(`${this.baseURL}/roadmap/checklist/${itemId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<ChecklistItem>(response);
  }

  async exportRoadmapPDF(): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/roadmap/export/pdf`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    return response.blob();
  }

  // Dashboard
  async getDashboardData(): Promise<{
    tasks: Task[];
    stats: UserStats;
    upcomingDeadlines: Array<{ item: string; daysLeft: number; type: string }>;
  }> {
    const response = await fetch(`${this.baseURL}/dashboard`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<{
      tasks: Task[];
      stats: UserStats;
      upcomingDeadlines: Array<{ item: string; daysLeft: number; type: string }>;
    }>(response);
  }

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/dashboard/tasks`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Task[]>(response);
  }

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await fetch(`${this.baseURL}/dashboard/tasks/${taskId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Task>(response);
  }

  async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${this.baseURL}/dashboard/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<UserStats>(response);
  }

  // Feedback
  async submitFeedback(data: CreateFeedbackRequest): Promise<Feedback> {
    const response = await fetch(`${this.baseURL}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Feedback>(response);
  }

  async getFeedback(): Promise<Feedback[]> {
    const response = await fetch(`${this.baseURL}/feedback`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Feedback[]>(response);
  }
}

// Create and export a singleton instance
export const apiService = new ApiService(API_BASE_URL);
export default apiService; 