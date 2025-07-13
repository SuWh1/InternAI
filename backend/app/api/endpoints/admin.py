from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.core.config import settings
from app.crud.user import delete_user as crud_delete_user
from sqlalchemy import select
from uuid import UUID

router = APIRouter()

def require_admin(user=Depends(get_current_user)):
    print(f"Checking admin: user.email={user.email}, user.is_admin={user.is_admin}")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return user

@router.get("/users")
async def get_all_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [{"id": u.id, "email": u.email, "is_admin": u.is_admin} for u in users]

@router.delete("/users/{user_id}")
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    # Use the proper delete_user function from crud
    success = await crud_delete_user(db, str(user_id))
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}
