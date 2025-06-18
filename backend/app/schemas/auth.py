from pydantic import BaseModel
from app.schemas.user import User

# Schema for auth response
class AuthResponse(BaseModel):
    user: User
    token: str 