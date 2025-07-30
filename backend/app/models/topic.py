from sqlalchemy import Column, String, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

class Topic(Base):
    __tablename__ = "topics"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    subtopics = Column(JSON, nullable=True)  # Store array of subtopic objects
    completed_subtopics = Column(JSON, nullable=True, default=list)  # Store array of indices
    is_public = Column(Boolean, nullable=False, default=False)  # Whether topic is public or private
    
    # Relationship to user
    user = relationship("User", back_populates="topics")