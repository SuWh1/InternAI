from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.learning_content import LearningContent

async def get_learning_content(
    db: AsyncSession, 
    user_id: UUID, 
    topic: str, 
    content_type: str,
    context: Optional[str] = None
) -> Optional[LearningContent]:
    """Get learning content for a specific user, topic, and type."""
    query = select(LearningContent).where(
        LearningContent.user_id == user_id,
        LearningContent.topic == topic,
        LearningContent.content_type == content_type
    )
    
    if context:
        query = query.where(LearningContent.context == context)
    
    # Order by most recent and get the first match to handle duplicates gracefully
    query = query.order_by(LearningContent.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().first()

async def get_learning_content_by_user(
    db: AsyncSession, 
    user_id: UUID,
    content_type: Optional[str] = None
) -> List[LearningContent]:
    """Get all learning content for a user, optionally filtered by type."""
    query = select(LearningContent).where(LearningContent.user_id == user_id)
    
    if content_type:
        query = query.where(LearningContent.content_type == content_type)
    
    query = query.order_by(LearningContent.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

async def create_learning_content(
    db: AsyncSession,
    user_id: UUID,
    content_type: str,
    topic: str,
    content_data: Dict[str, Any],
    context: Optional[str] = None,
    user_level: str = "intermediate",
    generation_metadata: Optional[Dict[str, Any]] = None
) -> LearningContent:
    """Create new learning content."""
    learning_content = LearningContent(
        user_id=user_id,
        content_type=content_type,
        topic=topic,
        context=context,
        content_data=content_data,
        user_level=user_level,
        ai_generated=True,
        generation_metadata=generation_metadata or {},
        access_count="0",
        last_accessed=None
    )
    
    db.add(learning_content)
    await db.commit()
    await db.refresh(learning_content)
    return learning_content

async def upsert_learning_content(
    db: AsyncSession,
    user_id: UUID,
    content_type: str,
    topic: str,
    content_data: Dict[str, Any],
    context: Optional[str] = None,
    user_level: str = "intermediate",
    generation_metadata: Optional[Dict[str, Any]] = None
) -> LearningContent:
    """Create or update learning content."""
    existing = await get_learning_content(db, user_id, topic, content_type, context)
    
    if existing:
        # Update existing content
        existing.content_data = content_data
        existing.user_level = user_level
        existing.generation_metadata = generation_metadata or {}
        existing.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        # Create new content
        return await create_learning_content(
            db=db,
            user_id=user_id,
            content_type=content_type,
            topic=topic,
            content_data=content_data,
            context=context,
            user_level=user_level,
            generation_metadata=generation_metadata
        )

async def update_access_tracking(
    db: AsyncSession,
    learning_content_id: UUID,
) -> Optional[LearningContent]:
    """Update access count and last accessed time for learning content."""
    result = await db.execute(select(LearningContent).where(LearningContent.id == learning_content_id))
    content = result.scalar_one_or_none()
    
    if content:
        # Increment access count
        current_count = int(content.access_count or "0")
        content.access_count = str(current_count + 1)
        content.last_accessed = datetime.utcnow().isoformat()
        
        await db.commit()
        await db.refresh(content)
    
    return content

async def delete_learning_content(
    db: AsyncSession,
    user_id: UUID,
    topic: str,
    content_type: str,
    context: Optional[str] = None
) -> bool:
    """Delete learning content."""
    content = await get_learning_content(db, user_id, topic, content_type, context)
    
    if content:
        await db.delete(content)
        await db.commit()
        return True
    
    return False 