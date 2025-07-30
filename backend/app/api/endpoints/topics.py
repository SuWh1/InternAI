from fastapi import APIRouter, Depends, HTTPException, status
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List
from datetime import datetime
import uuid

from app.db.session import get_db
from app.schemas.user import User
from app.schemas.topic import Topic, TopicCreate, TopicUpdate, TopicList
from app.schemas.user_topic_progress import UserTopicProgress, UserTopicProgressCreate, UserTopicProgressUpdate
from app.schemas.common import GenericResponse
from app.crud.topic import (
    create_topic,
    get_topics_by_user_id,
    get_public_topics,
    get_topic_by_id,
    update_topic,
    delete_topic
)
from app.crud.user_topic_progress import (
    get_user_topic_progress,
    create_user_topic_progress,
    update_user_topic_progress,
    delete_user_topic_progress
)
from app.core.security import get_current_user
from app.core.rate_limit import limiter, RateLimits

router = APIRouter()

@router.post("/", response_model=Topic, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimits.API_WRITE)
async def create_user_topic(
    request: Request,
    topic_data: TopicCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new topic for the current user."""
    topic = await create_topic(
        db=db,
        user_id=current_user.id,
        name=topic_data.name
    )
    return topic

@router.get("/", response_model=TopicList)
@limiter.limit(RateLimits.API_READ)
async def get_user_topics(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all topics for the current user."""
    topics = await get_topics_by_user_id(db, current_user.id)
    return TopicList(topics=topics, total=len(topics))

@router.get("/public", response_model=TopicList)
@limiter.limit(RateLimits.API_READ)
async def get_all_public_topics(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all public topics from all users."""
    topics = await get_public_topics(db)
    # Add user_name to each topic for display
    for topic in topics:
        if hasattr(topic, 'user') and topic.user:
            topic.user_name = topic.user.name
    return TopicList(topics=topics, total=len(topics))

@router.get("/{topic_id}", response_model=Topic)
@limiter.limit(RateLimits.API_READ)
async def get_topic(
    request: Request,
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific topic by ID. Allows access to user's own topics or public topics."""
    # First try to get the topic as the user's own topic
    topic = await get_topic_by_id(db, topic_id, current_user.id)
    
    if not topic:
        # If not found as user's topic, check if it's a public topic
        from app.crud.topic import get_public_topic_by_id
        topic = await get_public_topic_by_id(db, topic_id)
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic not found"
            )
        
        # Add user_name for public topics
        if hasattr(topic, 'user') and topic.user:
            topic.user_name = topic.user.name
            
        # For public topics, check if current user has their own progress
        if topic.user_id != current_user.id:
            user_progress = await get_user_topic_progress(db, current_user.id, topic_id)
            if user_progress:
                # Override the topic's completed_subtopics with user's progress
                topic.completed_subtopics = user_progress.completed_subtopics
            else:
                # No progress yet, show empty progress
                topic.completed_subtopics = []
    
    return topic

@router.put("/{topic_id}", response_model=Topic)
@limiter.limit(RateLimits.API_WRITE)
async def update_user_topic(
    request: Request,
    topic_id: uuid.UUID,
    topic_data: TopicUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update a topic for the current user."""
    topic = await update_topic(
        db=db,
        topic_id=topic_id,
        user_id=current_user.id,
        name=topic_data.name,
        subtopics=topic_data.subtopics,
        completed_subtopics=topic_data.completed_subtopics,
        is_public=topic_data.is_public
    )
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    return topic

@router.delete("/{topic_id}", response_model=GenericResponse)
@limiter.limit(RateLimits.API_WRITE)
async def delete_user_topic(
    request: Request,
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a topic for the current user."""
    success = await delete_topic(db, topic_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    return GenericResponse(success=True, message="Topic deleted successfully")

# User Topic Progress Endpoints

@router.get("/{topic_id}/progress", response_model=UserTopicProgress)
@limiter.limit(RateLimits.API_READ)
async def get_topic_progress(
    request: Request,
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get current user's progress for a specific topic."""
    progress = await get_user_topic_progress(db, current_user.id, topic_id)
    if not progress:
        # Return empty progress if none exists
        return UserTopicProgress(
            id=uuid.uuid4(),
            user_id=current_user.id,
            topic_id=topic_id,
            completed_subtopics=[],
            created_at=datetime.utcnow(),
            updated_at=None
        )
    return progress

@router.put("/{topic_id}/progress", response_model=UserTopicProgress)
@limiter.limit(RateLimits.API_WRITE)
async def update_topic_progress(
    request: Request,
    topic_id: uuid.UUID,
    progress_data: UserTopicProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update current user's progress for a specific topic."""
    # Verify topic exists and is accessible
    from app.crud.topic import get_public_topic_by_id
    topic = await get_topic_by_id(db, topic_id, current_user.id)
    if not topic:
        # Check if it's a public topic
        topic = await get_public_topic_by_id(db, topic_id)
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic not found"
            )
    
    # Update or create progress
    progress = await update_user_topic_progress(
        db=db,
        user_id=current_user.id,
        topic_id=topic_id,
        completed_subtopics=progress_data.completed_subtopics
    )
    return progress

@router.delete("/{topic_id}/progress", response_model=GenericResponse)
@limiter.limit(RateLimits.API_WRITE)
async def delete_topic_progress(
    request: Request,
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete current user's progress for a specific topic."""
    success = await delete_user_topic_progress(db, current_user.id, topic_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found"
        )
    return GenericResponse(success=True, message="Progress deleted successfully")

@router.patch("/{topic_id}/visibility", response_model=Topic)
@limiter.limit(RateLimits.API_WRITE)
async def toggle_topic_visibility(
    request: Request,
    topic_id: uuid.UUID,
    is_public: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Toggle topic visibility (publish/unpublish)."""
    topic = await update_topic(
        db=db,
        topic_id=topic_id,
        user_id=current_user.id,
        is_public=is_public
    )
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    return topic