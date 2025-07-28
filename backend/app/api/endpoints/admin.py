from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user, get_password_hash
from app.core.config import settings
from app.crud.user import delete_user as crud_delete_user
from sqlalchemy import select, func
from uuid import UUID
from typing import List
from pydantic import BaseModel

router = APIRouter()

class BulkUserCreate(BaseModel):
    names: List[str]

def require_admin(user=Depends(get_current_user)):
    print(f"Checking admin: user.email={user.email}, user.is_admin={user.is_admin}")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return user

@router.get("/users")
async def get_all_users(
    page: int = 1, 
    limit: int = 20, 
    db: AsyncSession = Depends(get_db), 
    _: User = Depends(require_admin)
):
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get total count
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar()
    
    # Get paginated users
    result = await db.execute(
        select(User)
        .offset(offset)
        .limit(limit)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    
    # Calculate pagination info
    total_pages = (total + limit - 1) // limit
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "users": [{"id": u.id, "email": u.email, "is_admin": u.is_admin, "is_bot": u.is_bot} for u in users],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }

@router.post("/users/bulk-create")
async def bulk_create_users(
    bulk_data: BulkUserCreate, 
    db: AsyncSession = Depends(get_db), 
    _: User = Depends(require_admin)
):
    """Create multiple users at once for testing purposes."""
    created_users = []
    errors = []
    
    for name in bulk_data.names:
        if not name.strip():
            continue
            
        name = name.strip()
        email = f"{name.lower().replace(' ', '')}@gmail.com"
        
        try:
            # Check if user already exists
            existing_user = await db.execute(select(User).where(User.email == email))
            if existing_user.scalar_one_or_none():
                errors.append(f"User {email} already exists")
                continue
            
            # Create new user
            hashed_password = get_password_hash("password123")
            new_user = User(
                email=email,
                name=name,
                hashed_password=hashed_password,
                is_verified=True,
                is_active=True,
                is_admin=False,
                is_bot=True
            )
            
            db.add(new_user)
            await db.flush()  # Get the ID without committing
            
            created_users.append({
                "id": str(new_user.id),
                "email": new_user.email,
                "name": new_user.name
            })
            
        except Exception as e:
            errors.append(f"Failed to create user {name}: {str(e)}")
    
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save users: {str(e)}")
    
    return {
        "created_users": created_users,
        "errors": errors,
        "total_created": len(created_users),
        "total_errors": len(errors)
    }

@router.delete("/users/{user_id}")
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    # Use the proper delete_user function from crud
    success = await crud_delete_user(db, str(user_id))
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}
