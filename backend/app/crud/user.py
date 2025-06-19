from sqlalchemy.orm import Session
from typing import Optional
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    return db.query(User).filter(User.google_id == google_id).first()

def create_user(db: Session, user_data: UserCreate) -> User:
    db_user = get_user_by_email(db, email=user_data.email)
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
    db.commit()
    db.refresh(db_user)
    
    return db_user

def update_user(db: Session, user_id: str, user_data: UserUpdate) -> User:
    db_user = get_user_by_id(db, user_id=user_id)
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
    
    db.commit()
    db.refresh(db_user)
    
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email=email)
    
    if not user or not user.hashed_password:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user

def authenticate_google_user(db: Session, google_id: str, email: str, name: str, profile_picture: Optional[str] = None) -> User:
    print(f"DEBUG: Authenticating Google user - google_id: {google_id}, email: {email}, name: {name}")
    
    # First check if user exists by Google ID
    user = get_user_by_google_id(db, google_id=google_id)
    
    if user:
        print(f"DEBUG: Found existing user by Google ID: {user.id}")
        updated = False
        if user.name != name:
            user.name = name
            updated = True
        if profile_picture and user.profile_picture != profile_picture:
            user.profile_picture = profile_picture
            updated = True
        # Safety check: ensure is_active is never None
        if user.is_active is None:
            user.is_active = True
            updated = True
            print(f"WARNING: Fixed NULL is_active for user {user.id}")
        
        if updated:
            db.commit()
            db.refresh(user)
            print("DEBUG: Updated existing user info")
        
        return user

    # Check if user exists by email
    user = get_user_by_email(db, email=email)
    
    if user:
        print(f"DEBUG: Found existing user by email: {user.id}, linking Google ID")
        user.google_id = google_id
        if profile_picture:
            user.profile_picture = profile_picture
        if not user.name or user.name != name:  # Update name if it's empty or different
            user.name = name
        # Safety check: ensure is_active is never None
        if user.is_active is None:
            user.is_active = True
            print(f"WARNING: Fixed NULL is_active for user {user.id}")
        db.commit()
        db.refresh(user)
        return user
    
    # Create new user - bypass create_user to avoid email duplicate check
    print("DEBUG: Creating new Google user")
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
        db.commit()
        db.refresh(db_user)
        
        print(f"DEBUG: Successfully created new user: {db_user.id}")
        return db_user
        
    except Exception as e:
        print(f"ERROR: Failed to create Google user: {e}")
        db.rollback()
        # Try to find if user was created in the meantime (race condition)
        existing_user = get_user_by_email(db, email=email)
        if existing_user:
            print("DEBUG: User was created by another process, linking Google ID")
            existing_user.google_id = google_id
            if profile_picture:
                existing_user.profile_picture = profile_picture
            db.commit()
            db.refresh(existing_user)
            return existing_user
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create or find Google user: {str(e)}",
        )

def deactivate_user(db: Session, user_id: str) -> User:
    db_user = get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    
    return db_user 