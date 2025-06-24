from sqlalchemy import Column, String, Text, ForeignKey, JSON, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

class LearningContent(Base):
    __tablename__ = "learning_content"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Content identification
    content_type = Column(String, nullable=False)  # 'subtopics', 'explanation', 'resources'
    topic = Column(String, nullable=False)  # The main topic/theme
    context = Column(String, nullable=True)  # Additional context (e.g., week number, focus area)
    
    # Content data
    content_data = Column(JSON, nullable=False)  # Store the AI-generated content
    user_level = Column(String, default="intermediate")  # User's level when content was generated
    
    # Metadata
    ai_generated = Column(Boolean, default=True)
    generation_metadata = Column(JSON, nullable=True)  # Store model used, tokens, etc.
    
    # Access tracking
    access_count = Column(String, default="0")  # How many times user accessed this content
    last_accessed = Column(String, nullable=True)  # Last time user accessed this content
    
    # Relationship to user
    user = relationship("User", back_populates="learning_content")
    
    # Create composite index for efficient lookups
    __table_args__ = (
        Index('ix_learning_content_user_topic_type', 'user_id', 'topic', 'content_type'),
    ) 