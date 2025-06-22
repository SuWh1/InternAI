from sqlalchemy import Column, String, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    # The id, created_at, and updated_at columns are inherited from Base
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    roadmap_data = Column(JSON, nullable=False)  # Store the complete roadmap JSON
    progress_data = Column(JSON, nullable=True)  # Store progress tracking JSON
    roadmap_type = Column(String, default="3_month_internship_prep")
    ai_generated = Column(Boolean, default=True)
    generation_metadata = Column(JSON, nullable=True)  # Store pipeline results, personalization factors, etc.
    
    # Relationship to user
    user = relationship("User", back_populates="roadmap") 