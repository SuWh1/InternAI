from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    name: str

# Schema for user creation
class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=6)
    google_id: Optional[str] = None
    profile_picture: Optional[str] = None

# Schema for Google login
class GoogleAuthRequest(BaseModel):
    token: str

# Schema for user update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    profile_picture: Optional[str] = None

# Schema for user in DB
class UserInDB(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    profile_picture: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema for user response
class User(UserInDB):
    pass

# Schema for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str 