from sqlalchemy import Column, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

class UserTopicProgress(Base):
    __tablename__ = "user_topic_progress"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_subtopics = Column(JSON, nullable=False, default=list)  # Store array of completed subtopic indices
    
    # Relationships
    user = relationship("User")
    topic = relationship("Topic")
    
    # Create composite index for efficient lookups and ensure uniqueness
    __table_args__ = (
        Index('ix_user_topic_progress_user_topic', 'user_id', 'topic_id', unique=True),
    )