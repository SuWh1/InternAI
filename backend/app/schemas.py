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
    password: str = Field(..., min_length=6)

# Schema for user update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)

# Schema for user in DB
class UserInDB(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schema for user response
class User(UserInDB):
    pass

# Schema for token
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for token data
class TokenData(BaseModel):
    user_id: Optional[str] = None

# Schema for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for auth response
class AuthResponse(BaseModel):
    user: User
    token: str

# Generic response
class GenericResponse(BaseModel):
    success: bool
    message: str 