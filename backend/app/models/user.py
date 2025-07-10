from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for social logins
    is_active = Column(Boolean, default=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    profile_picture = Column(String, nullable=True)
    phone = Column(String, nullable=True)  # User phone number
    
    # Relationship to onboarding data
    onboarding_data = relationship("OnboardingData", back_populates="user", uselist=False)
    
    # Relationship to roadmap
    roadmap = relationship("Roadmap", back_populates="user", uselist=False)
    
    # Relationship to learning content
    learning_content = relationship("LearningContent", back_populates="user") 