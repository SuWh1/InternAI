from pydantic import BaseModel
from app.schemas.user import User

# Schema for auth response
class AuthResponse(BaseModel):
    user: User
    token: str
    refresh_token: str

# Schema for refresh token request
class RefreshTokenRequest(BaseModel):
    refresh_token: str 

# Schema for PIN verification
class PinVerificationRequest(BaseModel):
    email: str
    code: str

# Schema for PIN resend
class PinResendRequest(BaseModel):
    email: str

# Schema for password reset request
class PasswordResetRequest(BaseModel):
    email: str

# Schema for password reset confirmation
class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str