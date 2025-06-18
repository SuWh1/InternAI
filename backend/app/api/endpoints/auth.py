from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserLogin, GoogleAuthRequest
from app.schemas.auth import AuthResponse
from app.schemas.common import GenericResponse
from app.crud.user import create_user, authenticate_user, authenticate_google_user
from app.core.security import create_access_token, get_current_user
from app.core.config import settings
from app.utils.google_auth import verify_google_token

router = APIRouter()

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> Any:
    user = create_user(db, user_data)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "user": user,
        "token": access_token
    }

@router.post("/login", response_model=AuthResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)) -> Any:
    user = authenticate_user(db, user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "user": user,
        "token": access_token
    }

@router.post("/google", response_model=AuthResponse)
async def google_login(auth_data: GoogleAuthRequest, db: Session = Depends(get_db)) -> Any:
    user_info = await verify_google_token(auth_data.token)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Authenticate or create user with Google credentials
    user = authenticate_google_user(
        db,
        google_id=user_info["google_id"],
        email=user_info["email"],
        name=user_info["name"],
        profile_picture=user_info.get("profile_picture")
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "user": user,
        "token": access_token
    }

@router.post("/logout", response_model=GenericResponse)
def logout(response: Response) -> Any:
    """
    Logout user (client-side only).
    """
    return {"success": True, "message": "Successfully logged out"}

@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user info.
    """
    return current_user 