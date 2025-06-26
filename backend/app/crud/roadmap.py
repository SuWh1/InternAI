from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
import uuid

from app.models.roadmap import Roadmap

async def get_roadmap_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[Roadmap]:
    """Get roadmap by user ID."""
    result = await db.execute(select(Roadmap).where(Roadmap.user_id == user_id))
    return result.scalar_one_or_none()

async def create_roadmap(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    roadmap_data: Dict[str, Any],
    progress_data: Optional[Dict[str, Any]] = None,
    generation_metadata: Optional[Dict[str, Any]] = None,
    ai_generated: bool = True
) -> Roadmap:
    """Create a new roadmap for a user."""
    db_roadmap = Roadmap(
        user_id=user_id,
        roadmap_data=roadmap_data,
        progress_data=progress_data or [],
        generation_metadata=generation_metadata,
        ai_generated=ai_generated
    )
    db.add(db_roadmap)
    await db.commit()
    await db.refresh(db_roadmap)
    return db_roadmap

async def update_roadmap(
    db: AsyncSession,
    user_id: uuid.UUID,
    roadmap_data: Optional[Dict[str, Any]] = None,
    progress_data: Optional[Dict[str, Any]] = None,
    generation_metadata: Optional[Dict[str, Any]] = None
) -> Optional[Roadmap]:
    """Update existing roadmap for a user."""
    db_roadmap = await get_roadmap_by_user_id(db, user_id)
    if not db_roadmap:
        return None
    
    if roadmap_data is not None:
        db_roadmap.roadmap_data = roadmap_data
    if progress_data is not None:
        db_roadmap.progress_data = progress_data
    if generation_metadata is not None:
        db_roadmap.generation_metadata = generation_metadata
    
    await db.commit()
    await db.refresh(db_roadmap)
    return db_roadmap

async def upsert_roadmap(
    db: AsyncSession,
    user_id: uuid.UUID,
    roadmap_data: Dict[str, Any],
    progress_data: Optional[Dict[str, Any]] = None,
    generation_metadata: Optional[Dict[str, Any]] = None,
    ai_generated: bool = True
) -> Roadmap:
    """Create or update roadmap for a user."""
    existing_roadmap = await get_roadmap_by_user_id(db, user_id)
    
    if existing_roadmap:
        # Update existing roadmap
        existing_roadmap.roadmap_data = roadmap_data
        if progress_data is not None:
            existing_roadmap.progress_data = progress_data
        if generation_metadata is not None:
            existing_roadmap.generation_metadata = generation_metadata
        existing_roadmap.ai_generated = ai_generated
        
        await db.commit()
        await db.refresh(existing_roadmap)
        return existing_roadmap
    else:
        # Create new roadmap
        return await create_roadmap(
            db=db,
            user_id=user_id,
            roadmap_data=roadmap_data,
            progress_data=progress_data,
            generation_metadata=generation_metadata,
            ai_generated=ai_generated
        )

async def update_roadmap_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    progress_data: Dict[str, Any]
) -> Optional[Roadmap]:
    """Update only the progress data for a user's roadmap."""
    return await update_roadmap(db, user_id, progress_data=progress_data)

async def delete_roadmap(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Delete roadmap for a user."""
    db_roadmap = await get_roadmap_by_user_id(db, user_id)
    if db_roadmap:
        await db.delete(db_roadmap)
        await db.commit()
        return True
    return False 