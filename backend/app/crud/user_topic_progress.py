from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from app.models.user_topic_progress import UserTopicProgress

async def get_user_topic_progress(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    topic_id: uuid.UUID
) -> Optional[UserTopicProgress]:
    """Get user's progress for a specific topic."""
    result = await db.execute(
        select(UserTopicProgress)
        .where(UserTopicProgress.user_id == user_id)
        .where(UserTopicProgress.topic_id == topic_id)
    )
    return result.scalar_one_or_none()

async def create_user_topic_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    topic_id: uuid.UUID,
    completed_subtopics: List[int] = None
) -> UserTopicProgress:
    """Create new user topic progress entry."""
    db_progress = UserTopicProgress(
        user_id=user_id,
        topic_id=topic_id,
        completed_subtopics=completed_subtopics or []
    )
    db.add(db_progress)
    await db.commit()
    await db.refresh(db_progress)
    return db_progress

async def update_user_topic_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    topic_id: uuid.UUID,
    completed_subtopics: List[int]
) -> Optional[UserTopicProgress]:
    """Update user's progress for a topic."""
    db_progress = await get_user_topic_progress(db, user_id, topic_id)
    
    if db_progress:
        db_progress.completed_subtopics = completed_subtopics
        await db.commit()
        await db.refresh(db_progress)
        return db_progress
    else:
        # Create new progress entry if it doesn't exist
        return await create_user_topic_progress(db, user_id, topic_id, completed_subtopics)

async def delete_user_topic_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    topic_id: uuid.UUID
) -> bool:
    """Delete user's progress for a topic."""
    db_progress = await get_user_topic_progress(db, user_id, topic_id)
    if db_progress:
        await db.delete(db_progress)
        await db.commit()
        return True
    return False