from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

# Base schema for user topic progress
class UserTopicProgressBase(BaseModel):
    completed_subtopics: List[int] = Field(default_factory=list, description="Indices of completed subtopics")

# Schema for creating user topic progress
class UserTopicProgressCreate(UserTopicProgressBase):
    topic_id: uuid.UUID = Field(..., description="Topic ID")

# Schema for updating user topic progress
class UserTopicProgressUpdate(BaseModel):
    completed_subtopics: List[int] = Field(..., description="Indices of completed subtopics")

# Schema for user topic progress in database
class UserTopicProgressInDB(UserTopicProgressBase):
    id: uuid.UUID
    user_id: uuid.UUID
    topic_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schema for user topic progress response
class UserTopicProgress(UserTopicProgressInDB):
    pass