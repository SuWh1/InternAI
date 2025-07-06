from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.core.config import settings
from sqlalchemy import select
from uuid import UUID

router = APIRouter()

def require_admin(user=Depends(get_current_user)):
    if user.email != settings.ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Not authorized")
    return user

@router.get("/users")
async def get_all_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [{"id": u.id, "email": u.email} for u in users]

@router.delete("/users/{user_id}")
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted"}
