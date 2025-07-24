from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.db.base import Base

class PendingUser(Base):
    __tablename__ = "pending_users"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    pin_code = Column(String, nullable=False)  # 6-digit verification code
    pin_expires = Column(DateTime, nullable=False)  # PIN expiration time

class User(Base):
    __tablename__ = "users"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for social logins
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Admin status
    google_id = Column(String, unique=True, nullable=True, index=True)
    profile_picture = Column(String, nullable=True)
    phone = Column(String, nullable=True)  # User phone number
    
    # Email verification fields
    is_verified = Column(Boolean, default=False)
    pin_code = Column(String, nullable=True)  # 6-digit verification code
    pin_expires = Column(DateTime, nullable=True)  # PIN expiration time
    
    # Computed property to expose whether user has a traditional password set
    @property
    def has_password(self) -> bool:
        """Return True if a hashed password exists (non-social login)."""
        return bool(self.hashed_password)
    
    # Relationship to onboarding data
    onboarding_data = relationship("OnboardingData", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # Relationship to roadmap
    roadmap = relationship("Roadmap", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # Relationship to learning content
    learning_content = relationship("LearningContent", back_populates="user", cascade="all, delete-orphan")
    
    # Relationship to topics
    topics = relationship("Topic", back_populates="user", cascade="all, delete-orphan")