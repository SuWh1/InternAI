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
    user = get_user_by_google_id(db, google_id=google_id)
    
    if user:
        updated = False
        if user.name != name:
            user.name = name
            updated = True
        if profile_picture and user.profile_picture != profile_picture:
            user.profile_picture = profile_picture
            updated = True
        
        if updated:
            db.commit()
            db.refresh(user)
        
        return user

    user = get_user_by_email(db, email=email)
    
    if user:
        user.google_id = google_id
        if profile_picture:
            user.profile_picture = profile_picture
        db.commit()
        db.refresh(user)
        return user
    
    # Create new user
    user_data = UserCreate(
        email=email,
        name=name,
        google_id=google_id,
        profile_picture=profile_picture
    )
    
    return create_user(db, user_data)

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