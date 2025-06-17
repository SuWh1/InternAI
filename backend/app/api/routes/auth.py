from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.database import get_db
from app.schemas import User, UserCreate, UserLogin, AuthResponse, GenericResponse
from app.crud import create_user, authenticate_user, get_user_by_id
from app.security import create_access_token, get_current_user
from app.config import settings

router = APIRouter()

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user.
    """
    # Create user
    user = create_user(db, user_data)
    
    # Create access token
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
    """
    Login for access token.
    """
    # Authenticate user
    user = authenticate_user(db, user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
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
    # Note: Since we're using JWT, we can't invalidate the token on the server side
    # The client should remove the token from local storage
    return {"success": True, "message": "Successfully logged out"}

@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user info.
    """
    return current_user 