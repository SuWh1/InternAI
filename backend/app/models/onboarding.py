from sqlalchemy import Column, String, Integer, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base

class OnboardingData(Base):
    __tablename__ = "onboarding_data"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    # Foreign key to user
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Personal Information
    current_year = Column(String, nullable=False)  # Freshman, Sophomore, Junior, Senior, Graduate
    major = Column(String, nullable=False)
    
    # Technical Background
    programming_languages = Column(JSON, nullable=False, default=list)  # List of languages
    frameworks = Column(JSON, nullable=False, default=list)  # List of frameworks
    tools = Column(JSON, nullable=False, default=list)  # List of tools
    preferred_tech_stack = Column(String, nullable=False)  # Single preferred technology stack
    experience_level = Column(String, nullable=False)  # Beginner, Intermediate, Advanced
    skill_confidence = Column(String, nullable=False)  # How confident they feel about their skills
    
    # Experience
    has_internship_experience = Column(Boolean, nullable=False, default=False)
    previous_internships = Column(Text, nullable=True)  # Text description
    projects = Column(Text, nullable=True)  # Text description of projects
    
    # Career Goals
    target_roles = Column(JSON, nullable=False, default=list)  # List of target roles
    preferred_company_types = Column(JSON, nullable=False, default=list)  # Startup, Big Tech, etc.
    preferred_locations = Column(JSON, nullable=False, default=list)  # List of preferred locations
    
    # Timeline
    application_timeline = Column(String, nullable=False)  # This Summer, Next Summer, etc.
    
    # Additional Info
    additional_info = Column(Text, nullable=True)  # Any additional information
    source_of_discovery = Column(String, nullable=True) # How the user found the platform
    
    # Relationship to user
    user = relationship("User", back_populates="onboarding_data") 