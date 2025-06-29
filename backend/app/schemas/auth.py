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