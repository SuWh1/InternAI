export interface OnboardingData {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  
  // Personal Information
  current_year: string;
  major: string;
  
  // Technical Background
  programming_languages: string[];
  frameworks_tools: string[];
  preferred_tech_stack: string[];
  experience_level: string;
  skill_confidence: string;
  
  // Experience
  has_internship_experience: boolean;
  previous_internships?: string;
  projects?: string;
  
  // Career Goals
  target_roles: string[];
  preferred_company_types: string[];
  preferred_locations: string[];
  
  // Target Internships
  target_internships: string[];
  
  // Timeline
  application_timeline: string;
  
  // Additional Info
  additional_info?: string;
}

export interface OnboardingCreate {
  // Personal Information
  current_year: string;
  major: string;
  
  // Technical Background
  programming_languages: string[];
  frameworks_tools: string[];
  preferred_tech_stack: string[];
  experience_level: string;
  skill_confidence: string;
  
  // Experience
  has_internship_experience: boolean;
  previous_internships?: string;
  projects?: string;
  
  // Career Goals
  target_roles: string[];
  preferred_company_types: string[];
  preferred_locations: string[];
  
  // Target Internships
  target_internships: string[];
  
  // Timeline
  application_timeline: string;
  
  // Additional Info
  additional_info?: string;
}

export interface OnboardingUpdate {
  current_year?: string;
  major?: string;
  programming_languages?: string[];
  frameworks_tools?: string[];
  preferred_tech_stack?: string[];
  experience_level?: string;
  skill_confidence?: string;
  has_internship_experience?: boolean;
  previous_internships?: string;
  projects?: string;
  target_roles?: string[];
  preferred_company_types?: string[];
  preferred_locations?: string[];
  target_internships?: string[];
  application_timeline?: string;
  additional_info?: string;
}

export interface OnboardingStatus {
  has_completed_onboarding: boolean;
  onboarding_data?: OnboardingData;
}

export interface OnboardingOptions {
  current_year_options: string[];
  experience_level_options: string[];
  skill_confidence_options: string[];
  preferred_tech_stack_options: string[];
  company_type_options: string[];
  target_role_options: string[];
  timeline_options: string[];
  default_internships: string[];
}

// Form data interface for step-by-step onboarding
export interface OnboardingFormData {
  // Step 1: Personal Information
  current_year: string;
  major: string;
  
  // Step 2: Technical Background
  programming_languages: string[];
  frameworks_tools: string[];
  preferred_tech_stack: string[];
  experience_level: string;
  skill_confidence: string;
  
  // Step 3: Experience
  has_internship_experience: boolean;
  previous_internships: string;
  projects: string;
  
  // Step 4: Career Goals
  target_roles: string[];
  preferred_company_types: string[];
  preferred_locations: string[];
  
  // Step 5: Target Internships & Timeline
  target_internships: string[];
  application_timeline: string;
  additional_info: string;
} 