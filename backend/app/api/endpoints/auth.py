from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from typing import Any
import uuid
import logging

from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserLogin, GoogleAuthRequest, UserUpdate, PasswordChange, AccountDeletion, AvatarUploadResponse
from app.schemas.auth import AuthResponse, PinVerificationRequest, PinResendRequest
from app.schemas.common import GenericResponse
from app.crud.user import create_user, authenticate_user, authenticate_google_user, get_user_by_id, update_user, delete_user, get_user_by_email, create_pending_user, get_pending_user_by_email, create_user_from_pending
from app.crud.onboarding import has_completed_onboarding
from app.core.security import (
    create_access_token, 
    create_refresh_token, 
    verify_refresh_token, 
    get_current_user,
    get_current_user_from_cookie,
    set_auth_cookies,
    clear_auth_cookies,
    verify_password,
    get_password_hash
)
from app.core.config import settings
from app.core.rate_limit import limiter, RateLimits
from app.utils.google_auth import verify_google_token
from app.utils.s3 import upload_avatar as s3_upload_avatar, delete_avatar as s3_delete_avatar
from app.utils.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter()

async def add_onboarding_status(user: User, db: AsyncSession) -> User:
    """Add onboarding status to user object."""
    user.has_completed_onboarding = await has_completed_onboarding(db, user.id)
    
    # Safety check: ensure is_active is never None
    if user.is_active is None:
        user.is_active = True
        await db.commit()
        await db.refresh(user)
        print(f"WARNING: Fixed NULL is_active for user {user.id}")
    
    return user

@router.post("/register", response_model=GenericResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimits.AUTH_REGISTER)
async def register(request: Request, response: Response, user_data: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    # Debug: log the received data
    logger.info(f"Registration attempt - Email: {user_data.email}, Name: '{user_data.name}'")
    
    # Generate PIN and set expiration
    pin = email_service.generate_pin_code()
    pin_expires = email_service.get_pin_expiration()
    
    # Create pending user (not verified yet)
    pending_user = await create_pending_user(db, user_data, pin, pin_expires)
    
    # Debug: log the pending user data
    logger.info(f"Created pending user - Email: {pending_user.email}, Name: '{pending_user.name}'")
    
    # Send verification email
    try:
        email_sent = await email_service.send_verification_email(pending_user.email, pin, pending_user.name)
        
        if not email_sent:
            # If email sending fails, we should still allow the user to try again
            # but we don't want to fail the registration completely
            logger.warning(f"Failed to send verification email to {pending_user.email}")
            return GenericResponse(
                message="Registration successful, but there was an issue sending the verification email. Please try to resend the verification code.",
                success=True
            )
            
    except Exception as e:
        logger.error(f"Exception sending verification email to {pending_user.email}: {e}")
        return GenericResponse(
            message="Registration successful, but there was an issue sending the verification email. Please try to resend the verification code.",
            success=True
        )

    return GenericResponse(
        message="Registration successful. Please check your email for the verification code.",
        success=True
    )

@router.post("/verify-pin", response_model=User)
@limiter.limit(RateLimits.AUTH_LOGIN)
async def verify_pin(request: Request, response: Response, pin_data: PinVerificationRequest, db: AsyncSession = Depends(get_db)) -> Any:
    """Verify PIN code and complete user registration."""
    # Get pending user by email
    pending_user = await get_pending_user_by_email(db, email=pin_data.email)
    if not pending_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending registration found for this email",
        )
    
    # Check if PIN is valid
    if not email_service.is_pin_valid(pending_user.pin_code, pending_user.pin_expires, pin_data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )
    
    # Create actual user from pending user
    user = await create_user_from_pending(db, pending_user)
    
    # Add onboarding status
    user = await add_onboarding_status(user, db)
    
    # Generate tokens and set cookies
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "is_admin": user.is_admin}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)
    
    return user

@router.post("/resend-pin", response_model=GenericResponse)
@limiter.limit(RateLimits.AUTH_LOGIN)
async def resend_pin(request: Request, pin_data: PinResendRequest, db: AsyncSession = Depends(get_db)) -> Any:
    """Resend PIN code to user's email."""
    # Get pending user by email
    pending_user = await get_pending_user_by_email(db, email=pin_data.email)
    if not pending_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending registration found for this email",
        )
    
    # Debug: log the pending user data for resend
    logger.info(f"Resending PIN - Email: {pending_user.email}, Name: '{pending_user.name}'")
    
    # Generate new PIN and set expiration
    pin = email_service.generate_pin_code()
    pin_expires = email_service.get_pin_expiration()
    
    # Update pending user with new PIN
    pending_user.pin_code = pin
    pending_user.pin_expires = pin_expires
    await db.commit()
    
    # Send verification email
    email_sent = await email_service.send_verification_email(pending_user.email, pin, pending_user.name)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again.",
        )
    
    return GenericResponse(
        message="Verification code sent successfully. Please check your email.",
        success=True
    )

@router.post("/login", response_model=User)
@limiter.limit(RateLimits.AUTH_LOGIN)
async def login(request: Request, response: Response, user_data: UserLogin, db: AsyncSession = Depends(get_db)) -> Any:
    user = await authenticate_user(db, user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await add_onboarding_status(user, db)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "is_admin": user.is_admin}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)
    
    # Return only user data
    return user

@router.post("/google", response_model=User)
@limiter.limit(RateLimits.AUTH_GOOGLE)
async def google_login(request: Request, response: Response, auth_data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)) -> Any:
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
        user = await authenticate_google_user(
            db,
            google_id=user_info["google_id"],
            email=user_info["email"],
            name=user_info["name"],
            profile_picture=user_info.get("profile_picture")
        )
        
        print(f"DEBUG: User authentication successful for user ID: {user.id}")
        
        # Step 3: Add onboarding status
        user = await add_onboarding_status(user, db)
        
        # Step 4: Create access token and refresh token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "is_admin": user.is_admin}, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        print(f"DEBUG: Access token created successfully for user: {user.email}")
        
        # Set cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        # Return only user data
        return user
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"ERROR: Unexpected error in Google login: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during Google authentication: {str(e)}",
        )

@router.post("/refresh", response_model=User)
@limiter.limit(RateLimits.AUTH_REFRESH)
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Refresh access token using refresh token from cookie.
    """
    # Get refresh token from cookie
    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = verify_refresh_token(refresh_token_value)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await add_onboarding_status(user, db)
    
    # Create new tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "is_admin": user.is_admin}, expires_delta=access_token_expires
    )
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Set new cookies
    set_auth_cookies(response, access_token, new_refresh_token)
    
    # Return only user data
    return user

@router.post("/logout", response_model=GenericResponse)
@limiter.limit(RateLimits.AUTH_GENERAL)
async def logout(request: Request, response: Response) -> Any:
    """
    Logout user - clear authentication cookies.
    """
    clear_auth_cookies(response)
    return {"success": True, "message": "Successfully logged out"}

@router.get("/me", response_model=User)
@limiter.limit(RateLimits.API_READ)
async def get_current_user_info(request: Request, current_user: User = Depends(get_current_user_from_cookie), db: AsyncSession = Depends(get_db)) -> Any:
    """
    Get current user info from cookie authentication.
    """
    return await add_onboarding_status(current_user, db)

@router.put("/profile", response_model=User)
@limiter.limit(RateLimits.API_WRITE)
async def update_user_profile(
    request: Request,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user_from_cookie),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update current user's profile information.
    """
    updated_user = await update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return await add_onboarding_status(updated_user, db)

@router.post("/upload-avatar", response_model=AvatarUploadResponse)
@limiter.limit(RateLimits.API_WRITE)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(None, alias="file"),
    avatar: UploadFile = File(None, alias="avatar"),
    current_user: User = Depends(get_current_user_from_cookie),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Upload user avatar.
    """
    # Pick whichever was uploaded
    upload = file or avatar
    if upload is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    # Validate file type
    if not upload.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate file size (10MB max)
    file_size = 0
    contents = await upload.read()
    file_size = len(contents)
    await upload.seek(0)  # Reset file position
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    # Upload to S3 and update user record
    await upload.seek(0)
    try:
        avatar_url = s3_upload_avatar(upload.file, upload.content_type)
    except RuntimeError as e:
        # Log the full error for debugging on the server
        print(f"ERROR: S3 upload failed: {e}")
        # Return a specific error to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file to storage. Reason: {e}"
        )

    # If the user had a previous avatar, clean it up (best-effort)
    if current_user.profile_picture:
        s3_delete_avatar(current_user.profile_picture)

    # Persist new avatar URL
    current_user.profile_picture = avatar_url
    await db.commit()
    await db.refresh(current_user)

    return {"url": avatar_url}

@router.post("/change-password", response_model=GenericResponse)
@limiter.limit(RateLimits.API_WRITE)
async def change_password(
    request: Request,
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user_from_cookie),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Change user's password.
    """
    # Verify current password
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for social login accounts"
        )
    
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_hashed_password = get_password_hash(password_change.new_password)
    user_update = UserUpdate(password=password_change.new_password)
    
    # Update the user's password in database
    updated_user = await update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"success": True, "message": "Password changed successfully"}

@router.delete("/account", response_model=GenericResponse)
@limiter.limit(RateLimits.API_WRITE)
async def delete_account(
    request: Request,
    response: Response,
    account_deletion: AccountDeletion,
    current_user: User = Depends(get_current_user_from_cookie),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Delete user's account permanently.
    """
    # Verify password for non-social accounts
    if current_user.hashed_password:
        if not verify_password(account_deletion.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is incorrect"
            )
    
    # Delete user account
    success = await delete_user(db, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Clear auth cookies
    clear_auth_cookies(response)
    
    return {"success": True, "message": "Account deleted successfully"}

@router.get("/google/debug")
@limiter.limit(RateLimits.DEBUG_ENDPOINTS)
async def debug_google_config(request: Request) -> Any:
    """
    Debug endpoint to check Google OAuth configuration.
    """
    return {
        "google_client_id_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_ID != "your-google-client-id-here"),
        "google_client_id_preview": settings.GOOGLE_CLIENT_ID[:20] + "..." if settings.GOOGLE_CLIENT_ID else "Not set",
        "google_client_secret_configured": bool(settings.GOOGLE_CLIENT_SECRET and settings.GOOGLE_CLIENT_SECRET != "your-google-client-secret-here"),
        "redirect_uri": settings.GOOGLE_REDIRECT_URI
    }