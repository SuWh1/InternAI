from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserLogin, GoogleAuthRequest
from app.schemas.auth import AuthResponse
from app.schemas.common import GenericResponse
from app.crud.user import create_user, authenticate_user, authenticate_google_user
from app.crud.onboarding import has_completed_onboarding
from app.core.security import create_access_token, get_current_user
from app.core.config import settings
from app.utils.google_auth import verify_google_token

router = APIRouter()

def add_onboarding_status(user: User, db: Session) -> User:
    """Add onboarding status to user object."""
    user.has_completed_onboarding = has_completed_onboarding(db, user.id)
    
    # Safety check: ensure is_active is never None
    if user.is_active is None:
        user.is_active = True
        db.commit()
        db.refresh(user)
        print(f"WARNING: Fixed NULL is_active for user {user.id}")
    
    return user

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> Any:
    user = create_user(db, user_data)
    user = add_onboarding_status(user, db)
    
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
    
    user = add_onboarding_status(user, db)
    
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
    print(f"DEBUG: Google login attempt with token length: {len(auth_data.token) if auth_data.token else 0}")
    
    # Check if Google OAuth is configured
    if not settings.GOOGLE_CLIENT_ID or settings.GOOGLE_CLIENT_ID == "your-google-client-id-here":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured on server. Please contact administrator.",
        )
    
    try:
        # Step 1: Verify Google token
        user_info = await verify_google_token(auth_data.token)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token. Please check your Google OAuth configuration.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"DEBUG: Token verified successfully for email: {user_info['email']}")
        
        # Step 2: Authenticate or create user with Google credentials
        user = authenticate_google_user(
            db,
            google_id=user_info["google_id"],
            email=user_info["email"],
            name=user_info["name"],
            profile_picture=user_info.get("profile_picture")
        )
        
        print(f"DEBUG: User authentication successful for user ID: {user.id}")
        
        # Step 3: Add onboarding status
        user = add_onboarding_status(user, db)
        
        # Step 4: Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        print(f"DEBUG: Access token created successfully for user: {user.email}")
        
        return {
            "user": user,
            "token": access_token
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"ERROR: Unexpected error in Google login: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during Google authentication: {str(e)}",
        )

@router.post("/logout", response_model=GenericResponse)
def logout(response: Response) -> Any:
    """
    Logout user (client-side only).
    """
    return {"success": True, "message": "Successfully logged out"}

@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Any:
    """
    Get current user info.
    """
    return add_onboarding_status(current_user, db)

@router.get("/google/debug")
def debug_google_config() -> Any:
    """
    Debug endpoint to check Google OAuth configuration.
    """
    return {
        "google_client_id_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_ID != "your-google-client-id-here"),
        "google_client_id_preview": settings.GOOGLE_CLIENT_ID[:20] + "..." if settings.GOOGLE_CLIENT_ID else "Not set",
        "google_client_secret_configured": bool(settings.GOOGLE_CLIENT_SECRET and settings.GOOGLE_CLIENT_SECRET != "your-google-client-secret-here"),
        "redirect_uri": settings.GOOGLE_REDIRECT_URI
    } 