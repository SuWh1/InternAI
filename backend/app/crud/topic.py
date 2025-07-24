from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
import uuid

from app.models.topic import Topic

async def get_topics_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> List[Topic]:
    """Get all topics for a user."""
    result = await db.execute(
        select(Topic)
        .where(Topic.user_id == user_id)
        .order_by(Topic.created_at.desc())
    )
    return result.scalars().all()

async def get_topic_by_id(db: AsyncSession, topic_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Topic]:
    """Get a specific topic by ID for a user."""
    result = await db.execute(
        select(Topic)
        .where(Topic.id == topic_id)
        .where(Topic.user_id == user_id)
    )
    return result.scalar_one_or_none()

async def create_topic(
    db: AsyncSession,
    user_id: uuid.UUID,
    name: str,
    subtopics: Optional[List[Dict[str, Any]]] = None,
    completed_subtopics: Optional[List[int]] = None
) -> Topic:
    """Create a new topic for a user."""
    db_topic = Topic(
        user_id=user_id,
        name=name,
        subtopics=subtopics or [],
        completed_subtopics=completed_subtopics or []
    )
    db.add(db_topic)
    await db.commit()
    await db.refresh(db_topic)
    return db_topic

async def update_topic(
    db: AsyncSession,
    topic_id: uuid.UUID,
    user_id: uuid.UUID,
    name: Optional[str] = None,
    subtopics: Optional[List[Dict[str, Any]]] = None,
    completed_subtopics: Optional[List[int]] = None
) -> Optional[Topic]:
    """Update an existing topic for a user."""
    db_topic = await get_topic_by_id(db, topic_id, user_id)
    if not db_topic:
        return None
    
    if name is not None:
        db_topic.name = name
    if subtopics is not None:
        db_topic.subtopics = subtopics
    if completed_subtopics is not None:
        db_topic.completed_subtopics = completed_subtopics
    
    await db.commit()
    await db.refresh(db_topic)
    return db_topic

async def delete_topic(db: AsyncSession, topic_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Delete a topic for a user."""
    db_topic = await get_topic_by_id(db, topic_id, user_id)
    if db_topic:
        await db.delete(db_topic)
        await db.commit()
        return True
    return False 