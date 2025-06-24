from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.learning_content import LearningContent

def get_learning_content(
    db: Session, 
    user_id: UUID, 
    topic: str, 
    content_type: str,
    context: Optional[str] = None
) -> Optional[LearningContent]:
    """Get learning content for a specific user, topic, and type."""
    query = db.query(LearningContent).filter(
        LearningContent.user_id == user_id,
        LearningContent.topic == topic,
        LearningContent.content_type == content_type
    )
    
    if context:
        query = query.filter(LearningContent.context == context)
    
    return query.first()

def get_learning_content_by_user(
    db: Session, 
    user_id: UUID,
    content_type: Optional[str] = None
) -> List[LearningContent]:
    """Get all learning content for a user, optionally filtered by type."""
    query = db.query(LearningContent).filter(LearningContent.user_id == user_id)
    
    if content_type:
        query = query.filter(LearningContent.content_type == content_type)
    
    return query.order_by(LearningContent.created_at.desc()).all()

def create_learning_content(
    db: Session,
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
    db.commit()
    db.refresh(learning_content)
    return learning_content

def upsert_learning_content(
    db: Session,
    user_id: UUID,
    content_type: str,
    topic: str,
    content_data: Dict[str, Any],
    context: Optional[str] = None,
    user_level: str = "intermediate",
    generation_metadata: Optional[Dict[str, Any]] = None
) -> LearningContent:
    """Create or update learning content."""
    existing = get_learning_content(db, user_id, topic, content_type, context)
    
    if existing:
        # Update existing content
        existing.content_data = content_data
        existing.user_level = user_level
        existing.generation_metadata = generation_metadata or {}
        existing.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new content
        return create_learning_content(
            db=db,
            user_id=user_id,
            content_type=content_type,
            topic=topic,
            content_data=content_data,
            context=context,
            user_level=user_level,
            generation_metadata=generation_metadata
        )

def update_access_tracking(
    db: Session,
    learning_content_id: UUID,
) -> Optional[LearningContent]:
    """Update access count and last accessed time for learning content."""
    content = db.query(LearningContent).filter(LearningContent.id == learning_content_id).first()
    
    if content:
        # Increment access count
        current_count = int(content.access_count or "0")
        content.access_count = str(current_count + 1)
        content.last_accessed = datetime.utcnow().isoformat()
        
        db.commit()
        db.refresh(content)
    
    return content

def delete_learning_content(
    db: Session,
    user_id: UUID,
    topic: str,
    content_type: str,
    context: Optional[str] = None
) -> bool:
    """Delete learning content."""
    content = get_learning_content(db, user_id, topic, content_type, context)
    
    if content:
        db.delete(content)
        db.commit()
        return True
    
    return False 