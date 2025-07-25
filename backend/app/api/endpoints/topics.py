from fastapi import APIRouter, Depends, HTTPException, status
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List
import uuid

from app.db.session import get_db
from app.schemas.user import User
from app.schemas.topic import Topic, TopicCreate, TopicUpdate, TopicList
from app.schemas.common import GenericResponse
from app.crud.topic import (
    create_topic,
    get_topics_by_user_id,
    get_topic_by_id,
    update_topic,
    delete_topic
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

@router.get("/{topic_id}", response_model=Topic)
@limiter.limit(RateLimits.API_READ)
async def get_topic(
    request: Request,
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific topic by ID."""
    topic = await get_topic_by_id(db, topic_id, current_user.id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
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
        completed_subtopics=topic_data.completed_subtopics
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