from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

# Base schema for onboarding data
class OnboardingBase(BaseModel):
    # Personal Information
    current_year: str = Field(..., description="Current academic year")
    major: str = Field(..., description="Major/field of study")
    
    # Technical Background
    programming_languages: List[str] = Field(default_factory=list, description="Programming languages known")
    frameworks: List[str] = Field(default_factory=list, description="Frameworks known")
    tools: List[str] = Field(default_factory=list, description="Tools known")
    preferred_tech_stack: str = Field(..., description="Preferred technology stack for internships")
    experience_level: str = Field(..., description="Overall experience level")
    skill_confidence: str = Field(..., description="Confidence level in technical skills")
    
    # Experience
    has_internship_experience: bool = Field(default=False, description="Has previous internship experience")
    previous_internships: Optional[str] = Field(None, description="Description of previous internships")
    projects: Optional[str] = Field(None, description="Description of projects")
    
    # Career Goals
    target_roles: List[str] = Field(default_factory=list, description="Target roles/positions")
    preferred_company_types: List[str] = Field(default_factory=list, description="Preferred company types")
    preferred_locations: List[str] = Field(default_factory=list, description="Preferred work locations")
    
    # Timeline
    application_timeline: str = Field(..., description="When planning to apply")
    
    # Additional Info
    additional_info: Optional[str] = Field(None, description="Additional information")
    source_of_discovery: Optional[str] = Field(None, description="How the user found the platform")

# Schema for creating onboarding data
class OnboardingCreate(OnboardingBase):
    pass

# Schema for updating onboarding data
class OnboardingUpdate(BaseModel):
    current_year: Optional[str] = None
    major: Optional[str] = None
    programming_languages: Optional[List[str]] = None
    frameworks: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    preferred_tech_stack: Optional[str] = None
    experience_level: Optional[str] = None
    skill_confidence: Optional[str] = None
    has_internship_experience: Optional[bool] = None
    previous_internships: Optional[str] = None
    projects: Optional[str] = None
    target_roles: Optional[List[str]] = None
    preferred_company_types: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    application_timeline: Optional[str] = None
    additional_info: Optional[str] = None
    source_of_discovery: Optional[str] = None

# Schema for onboarding data in database
class OnboardingInDB(OnboardingBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schema for onboarding response
class OnboardingData(OnboardingInDB):
    pass

# Schema for checking onboarding status
class OnboardingStatus(BaseModel):
    has_completed_onboarding: bool
    onboarding_data: Optional[OnboardingData] = None

# Constants for onboarding options
CURRENT_YEAR_OPTIONS = [
    "High School Student",
    "1st year",
    "2nd year", 
    "3rd year",
    "4th year",
    "5th year",
    "Recent Graduate"
    "Other"
]

EXPERIENCE_LEVEL_OPTIONS = [
    "Beginner",
    "Intermediate", 
    "Advanced"
]

SKILL_CONFIDENCE_OPTIONS = [
    "Very confident - I can build complex projects independently",
    "Confident - I can work on most tasks with minimal guidance", 
    "Moderately confident - I can handle basic tasks but need guidance for complex ones",
    "Learning - I'm still building foundational skills",
    "Beginner - I'm just starting my coding journey"
]

PREFERRED_TECH_STACK_OPTIONS = [
    "Full-Stack Web Development",
    "Frontend Development (React, Vue, Angular)",
    "Backend Development (APIs, Databases)",
    "Mobile Development (iOS, Android, React Native)",
    "Data Science & Analytics",
    "Machine Learning & AI",
    "DevOps & Cloud Infrastructure",
    "Cybersecurity",
    "Game Development",
    "Blockchain & Web3",
    "Desktop Applications",
    "Embedded Systems & IoT"
]

COMPANY_TYPE_OPTIONS = [
    "Meta",
    "Apple",
    "Nvidia",
    "Google",
    "OpenAI",
]

TARGET_ROLE_OPTIONS = [
    "Software Engineer Intern",
    "Data Science Intern",
    "Machine Learning Intern",
    "Product Manager Intern",
    "UX/UI Design Intern",
    "DevOps/SRE Intern",
    "Security Engineer Intern",
    "Research Intern",
]

TIMELINE_OPTIONS = [
    "This Summer (2025)",
    "Fall (2025)",
    "Spring (2026)",
    "Next Summer (2026)", 
    
    "Not Sure Yet"
]