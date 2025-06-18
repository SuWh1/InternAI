from pydantic import BaseModel
from typing import Optional

# Schema for token
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for token data
class TokenData(BaseModel):
    user_id: Optional[str] = None 