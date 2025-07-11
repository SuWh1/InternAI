from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

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
    phone: Optional[str] = None

# Schema for user in DB
class UserInDB(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    profile_picture: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema for user response
class User(UserInDB):
    google_id: Optional[str] = None
    has_password: bool = False
    has_completed_onboarding: Optional[bool] = None

# Schema for password change
class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

# Schema for account deletion
class AccountDeletion(BaseModel):
    password: Optional[str] = Field(default="", min_length=0)  # Optional for social login users
    confirmation: str = Field(..., pattern="^DELETE$")  # Must type "DELETE" to confirm

# Schema for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str 

# Schema for avatar upload response
class AvatarUploadResponse(BaseModel):
    url: str 