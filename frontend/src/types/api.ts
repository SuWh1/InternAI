// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Onboarding types
export interface OnboardingAnswers {
  target: string;
  year: string;
  experience: string;
  languages: string[];
  timeCommitment: string;
  learningStyle: string;
  timeline: string;
  challenges: string;
}

export interface OnboardingQuestion {
  id: keyof OnboardingAnswers;
  title: string;
  type: 'select' | 'checkbox';
  options: string[];
}

// Roadmap types
export interface LearningWeek {
  id: string;
  week: string;
  topic: string;
  tasks: string[];
  hours: number;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  skills: string[];
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  item: string;
  completed: boolean;
}

export interface Roadmap {
  id: string;
  userId: string;
  target: string;
  year: string;
  experience: string;
  timeCommitment: string;
  timeline: string;
  learningPlan: LearningWeek[];
  projects: Project[];
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  weekId: string;
}

export interface UserStats {
  tasksCompleted: number;
  currentStreak: number;
  hoursLogged: number;
  totalTasks: number;
}

export interface Feedback {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  response?: string;
  respondedAt?: string;
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

// API Request types
export interface CreateRoadmapRequest {
  answers: OnboardingAnswers;
}

export interface UpdateTaskRequest {
  completed: boolean;
}

export interface CreateFeedbackRequest {
  content: string;
}

export interface UpdateChecklistItemRequest {
  completed: boolean;
} 