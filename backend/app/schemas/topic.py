from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid

# Schema for subtopic
class Subtopic(BaseModel):
    title: str
    description: str
    type: Optional[str] = None

# Base schema for topic data
class TopicBase(BaseModel):
    name: str = Field(..., description="Topic name")
    subtopics: Optional[List[Union[Dict[str, Any], str]]] = Field(default_factory=list, description="List of subtopics")
    completed_subtopics: List[int] = Field(default_factory=list, description="Indices of completed subtopics")
    is_public: bool = Field(default=False, description="Whether topic is public or private")

# Schema for creating topic
class TopicCreate(BaseModel):
    name: str = Field(..., description="Topic name")

# Schema for updating topic
class TopicUpdate(BaseModel):
    name: Optional[str] = None
    subtopics: Optional[List[Union[Dict[str, Any], str]]] = None
    completed_subtopics: Optional[List[int]] = None
    is_public: Optional[bool] = None

# Schema for topic in database
class TopicInDB(TopicBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = Field(None, description="Name of the user who created the topic")

    class Config:
        from_attributes = True

# Schema for API response
class Topic(TopicInDB):
    pass

# Schema for list of topics
class TopicList(BaseModel):
    topics: List[Topic]
    total: int