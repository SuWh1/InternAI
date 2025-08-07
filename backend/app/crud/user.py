from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional
from fastapi import HTTPException, status

from app.models.user import User, PendingUser
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_google_id(db: AsyncSession, google_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.google_id == google_id))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    db_user = await get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    user_dict = user_data.model_dump(exclude_unset=True)
    
    # Hash password if provided
    if user_dict.get("password"):
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    db_user = User(**user_dict)
    
    # Add to DB
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

async def update_user(db: AsyncSession, user_id: str, user_data: UserUpdate) -> User:
    db_user = await get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user_data_dict = user_data.model_dump(exclude_unset=True)
    
    if "password" in user_data_dict:
        user_data_dict["hashed_password"] = get_password_hash(user_data_dict.pop("password"))
    
    for field, value in user_data_dict.items():
        setattr(db_user, field, value)
    
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

async def authenticate_user(db: AsyncSession, email: str, password: str) -> tuple[Optional[User], str]:
    """
    Authenticate user and return tuple of (user, error_type)
    error_type can be: 'success', 'user_not_found', 'incorrect_password', 'google_user'
    """
    print(f"DEBUG: authenticate_user called with email: {email}")
    
    user = await get_user_by_email(db, email=email)
    print(f"DEBUG: get_user_by_email returned: {user is not None}, email: {user.email if user else 'None'}, has_password: {bool(user.hashed_password) if user else 'None'}, google_id: {bool(user.google_id) if user else 'None'}")
    
    if not user:
        print(f"DEBUG: User not found for email: {email}")
        return None, 'user_not_found'
    
    if not user.hashed_password:
        if user.google_id:
            print(f"DEBUG: User {email} is a Google user without password")
            return None, 'google_user'
        else:
            print(f"DEBUG: User {email} has no hashed_password and no google_id")
            return None, 'user_not_found'
    
    password_valid = verify_password(password, user.hashed_password)
    print(f"DEBUG: Password verification for {email}: {password_valid}")
    
    if not password_valid:
        return None, 'incorrect_password'
    
    print(f"DEBUG: Authentication successful for {email}")
    return user, 'success'

async def authenticate_google_user(db: AsyncSession, google_id: str, email: str, name: str, profile_picture: Optional[str] = None) -> User:
    # First check if user exists by Google ID
    user = await get_user_by_google_id(db, google_id=google_id)
    
    if user:
        updated = False
        if user.name != name:
            user.name = name
            updated = True
        # Only update profile picture if it's not already set (to preserve custom avatars)
        if profile_picture and not user.profile_picture:
            user.profile_picture = profile_picture
            updated = True
        # Safety check: ensure is_active is never None
        if user.is_active is None:
            user.is_active = True
            updated = True
            print(f"WARNING: Fixed NULL is_active for user {user.id}")
        
        if updated:
            await db.commit()
            await db.refresh(user)
        
        return user

    # Check if user exists by email
    user = await get_user_by_email(db, email=email)
    
    if user:
        user.google_id = google_id
        # Only update profile picture if it's not already set
        if profile_picture and not user.profile_picture:
            user.profile_picture = profile_picture
        if not user.name or user.name != name:  # Update name if it's empty or different
            user.name = name
        # Safety check: ensure is_active is never None
        if user.is_active is None:
            user.is_active = True
            print(f"WARNING: Fixed NULL is_active for user {user.id}")
        await db.commit()
        await db.refresh(user)
        return user
    
    # Create new user - bypass create_user to avoid email duplicate check
    try:
        db_user = User(
            email=email,
            name=name,
            google_id=google_id,
            profile_picture=profile_picture,
            is_active=True,
            hashed_password=None  # Google users don't need password
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        return db_user
        
    except Exception as e:
        print(f"ERROR: Failed to create Google user: {e}")
        await db.rollback()
        # Try to find if user was created in the meantime (race condition)
        existing_user = await get_user_by_email(db, email=email)
        if existing_user:
            print("DEBUG: User was created by another process, linking Google ID")
            existing_user.google_id = google_id
            if profile_picture:
                existing_user.profile_picture = profile_picture
            await db.commit()
            await db.refresh(existing_user)
            return existing_user
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create or find Google user: {str(e)}",
        )

async def deactivate_user(db: AsyncSession, user_id: str) -> User:
    db_user = await get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    db_user.is_active = False
    await db.commit()
    await db.refresh(db_user)
    
    return db_user 

async def delete_user(db: AsyncSession, user_id: str) -> bool:
    """Permanently delete user and all related data."""
    try:
        # Check if user exists
        db_user = await get_user_by_id(db, user_id=user_id)
        if not db_user:
            return False
        
        # Use SQLAlchemy's delete statement instead of session.delete
        # This will properly trigger the CASCADE DELETE at the database level
        await db.execute(delete(User).where(User.id == user_id))
        await db.commit()
        
        return True
        
    except Exception as e:
        print(f"Error deleting user {user_id}: {e}")
        await db.rollback()
        return False

async def get_pending_user_by_email(db: AsyncSession, email: str) -> Optional[PendingUser]:
    result = await db.execute(select(PendingUser).where(PendingUser.email == email))
    return result.scalar_one_or_none()

async def create_pending_user(db: AsyncSession, user_data: UserCreate, pin_code: str, pin_expires) -> PendingUser:
    """Create a pending user registration (not verified yet)."""
    # Check if user already exists
    existing_user = await get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Check if there's already a pending registration and remove it
    existing_pending = await get_pending_user_by_email(db, email=user_data.email)
    if existing_pending:
        await db.delete(existing_pending)
        await db.commit()  # Ensure deletion is committed
    
    # Create pending user
    user_dict = user_data.model_dump(exclude_unset=True)
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["pin_code"] = pin_code
    user_dict["pin_expires"] = pin_expires
    
    pending_user = PendingUser(**user_dict)
    
    # Add to DB
    db.add(pending_user)
    await db.commit()
    await db.refresh(pending_user)
    
    return pending_user

async def create_user_from_pending(db: AsyncSession, pending_user: PendingUser) -> User:
    """Create a verified user from a pending user registration."""
    # Create the actual user
    user_dict = {
        "email": pending_user.email,
        "name": pending_user.name,
        "hashed_password": pending_user.hashed_password,
        "is_verified": True,
        "is_active": True,
        "is_admin": False
    }
    
    db_user = User(**user_dict)
    
    # Add user to DB
    db.add(db_user)
    
    # Delete pending user
    await db.delete(pending_user)
    
    await db.commit()
    await db.refresh(db_user)
    
    return db_user