from sqlalchemy.orm import Session
from typing import Optional
from app.models import User
from app.schemas import UserCreate, UserUpdate
from app.security import get_password_hash, verify_password
from fastapi import HTTPException, status

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get a user by ID"""
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user"""
    # Check if user already exists
    db_user = get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
    )
    
    # Add to DB
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def update_user(db: Session, user_id: str, user_data: UserUpdate) -> User:
    """Update a user"""
    # Get user
    db_user = get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Update fields
    user_data_dict = user_data.model_dump(exclude_unset=True)
    
    if "password" in user_data_dict:
        user_data_dict["hashed_password"] = get_password_hash(user_data_dict.pop("password"))
    
    for field, value in user_data_dict.items():
        setattr(db_user, field, value)
    
    # Save changes
    db.commit()
    db.refresh(db_user)
    
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user"""
    user = get_user_by_email(db, email=email)
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user

def deactivate_user(db: Session, user_id: str) -> User:
    """Deactivate a user"""
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