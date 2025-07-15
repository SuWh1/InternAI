from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import logging

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import TokenData

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a refresh JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt

def verify_refresh_token(token: str) -> Optional[str]:
    """Verify refresh token and return user_id"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            return None
            
        return user_id
    except JWTError:
        return None

async def get_current_user_from_header(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    """Get the current user from the Authorization header (deprecated - use cookie auth)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    # Get the user from the database with async query
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user

def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set authentication cookies with proper security settings"""
    # Determine if we're in production (HTTPS)
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    
    # Access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        httponly=True,
        secure=is_production,  # Only use secure in production (HTTPS)
        samesite="lax",  # CSRF protection while allowing navigation
        path="/"
    )
    
    # Refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # Convert to seconds
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/"
    )

def clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

async def get_current_user_from_cookie(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current user from the cookie.
    """
    logger = logging.getLogger(__name__)
    logger.info("Attempting to get current user from cookie.")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Get token from cookie
    token = request.cookies.get("access_token")
    if not token:
        logger.warning("Access token not found in cookies.")
        raise credentials_exception

    try:
        # Decode the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            logger.warning(f"Invalid access token payload or type. User ID: {user_id}, Type: {token_type}")
            raise credentials_exception
        
        token_data = TokenData(user_id=user_id)
        logger.info(f"Access token decoded successfully for user_id: {user_id}")
    except JWTError as e:
        logger.warning(f"JWTError decoding access token: {e}")
        raise credentials_exception
    
    # Get the user from the database with async query
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        logger.warning(f"User {token_data.user_id} not found or inactive for access token.")
        raise credentials_exception
    
    logger.info(f"Current user {user.id} retrieved successfully from access token.")
    return user

async def get_current_user_with_refresh(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current user from the cookie with automatic token refresh.
    If the access token is expired, it will attempt to refresh using the refresh token.
    """
    logger = logging.getLogger(__name__)
    logger.info("Attempting to get current user with automatic refresh.")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Get access token from cookie
    access_token = request.cookies.get("access_token")
    if not access_token:
        logger.info("Access token not found in cookies. Attempting to use refresh token.")
        # No access token, try to refresh using refresh token
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            logger.warning("Refresh token not found in cookies.")
            raise credentials_exception
        
        # Verify refresh token
        user_id = verify_refresh_token(refresh_token)
        if not user_id:
            logger.warning("Invalid refresh token.")
            raise credentials_exception
        
        # Get user from database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None or not user.is_active:
            logger.warning(f"User {user_id} not found or inactive during refresh.")
            raise credentials_exception
        
        # Create new tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            data={"sub": str(user.id), "is_admin": user.is_admin}, expires_delta=access_token_expires
        )
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Set new cookies
        set_auth_cookies(response, new_access_token, new_refresh_token)
        logger.info(f"Tokens refreshed successfully for user {user.id} (no access token case).")
        
        return user

    try:
        # Try to decode the access token
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        is_admin: bool = payload.get("is_admin", False)

        if user_id is None or token_type != "access":
            logger.warning(f"Invalid access token payload or type. User ID: {user_id}, Type: {token_type}")
            raise credentials_exception
        
        logger.info(f"Access token is valid for user_id: {user_id}")
        
        # Get the user from the database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None or not user.is_active:
            logger.warning(f"User {user_id} not found or inactive for access token.")
            raise credentials_exception
        
        logger.info(f"Current user {user.id} retrieved successfully from valid access token.")
        return user
        
    except JWTError as e:
        logger.info(f"Access token expired or invalid: {e}. Attempting refresh...")
        
        # Access token is expired or invalid, try to refresh
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            logger.warning("Refresh token not found in cookies.")
            raise credentials_exception
        
        # Verify refresh token
        user_id = verify_refresh_token(refresh_token)
        if not user_id:
            logger.warning("Invalid refresh token.")
            raise credentials_exception
        
        # Get user from database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None or not user.is_active:
            logger.warning(f"User {user_id} not found or inactive during refresh.")
            raise credentials_exception
        
        # Create new tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            data={"sub": str(user.id), "is_admin": user.is_admin}, expires_delta=access_token_expires
        )
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Set new cookies
        set_auth_cookies(response, new_access_token, new_refresh_token)
        logger.info(f"🔄 AUTOMATIC TOKEN REFRESH SUCCESSFUL for user {user.id}! New access token created.")
        
        return user

# Make get_current_user an alias to get_current_user_with_refresh for automatic refresh
# This allows existing endpoints to benefit from automatic refresh without changes
get_current_user = get_current_user_with_refresh