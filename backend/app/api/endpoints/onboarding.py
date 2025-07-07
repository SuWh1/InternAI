from fastapi import APIRouter, Depends, HTTPException, status
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.schemas.user import User
from app.schemas.onboarding import (
    OnboardingCreate, 
    OnboardingUpdate, 
    OnboardingData, 
    OnboardingStatus,
    CURRENT_YEAR_OPTIONS,
    EXPERIENCE_LEVEL_OPTIONS,
    SKILL_CONFIDENCE_OPTIONS,
    PREFERRED_TECH_STACK_OPTIONS,
    COMPANY_TYPE_OPTIONS,
    TARGET_ROLE_OPTIONS,
    TIMELINE_OPTIONS,
)
from app.schemas.common import GenericResponse
from app.crud.onboarding import (
    create_onboarding_data,
    get_onboarding_data_by_user_id,
    update_onboarding_data,
    delete_onboarding_data,
    has_completed_onboarding
)
from app.core.security import get_current_user
from app.core.rate_limit import limiter, RateLimits

router = APIRouter()

@router.post("/", response_model=OnboardingData, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimits.API_WRITE)
async def create_user_onboarding(
    request: Request,
    onboarding_data: OnboardingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create onboarding data for the current user."""
    
    # Check if user already has onboarding data
    existing_data = await get_onboarding_data_by_user_id(db, current_user.id)
    if existing_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has already completed onboarding"
        )
    
    # Create onboarding data
    created_data = await create_onboarding_data(db, current_user.id, onboarding_data)
    return created_data

@router.get("/status", response_model=OnboardingStatus)
@limiter.limit(RateLimits.API_READ)
async def get_onboarding_status(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get onboarding status for the current user."""
    
    onboarding_data = await get_onboarding_data_by_user_id(db, current_user.id)
    has_completed = onboarding_data is not None
    
    return {
        "has_completed_onboarding": has_completed,
        "onboarding_data": onboarding_data
    }

@router.get("/", response_model=OnboardingData)
@limiter.limit(RateLimits.API_READ)
async def get_user_onboarding(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get onboarding data for the current user."""
    
    onboarding_data = await get_onboarding_data_by_user_id(db, current_user.id)
    if not onboarding_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding data not found"
        )
    
    return onboarding_data

@router.put("/", response_model=OnboardingData)
@limiter.limit(RateLimits.API_WRITE)
async def update_user_onboarding(
    request: Request,
    onboarding_update: OnboardingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update onboarding data for the current user."""
    
    updated_data = await update_onboarding_data(db, current_user.id, onboarding_update)
    if not updated_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding data not found"
        )
    
    return updated_data

@router.delete("/", response_model=GenericResponse)
@limiter.limit(RateLimits.API_WRITE)
async def delete_user_onboarding(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete onboarding data for the current user."""
    
    success = await delete_onboarding_data(db, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding data not found"
        )
    
    return {"success": True, "message": "Onboarding data deleted successfully"}

@router.get("/options")
@limiter.limit(RateLimits.API_READ)
async def get_onboarding_options(request: Request) -> Any:
    """Get all available options for onboarding form."""
    
    return {
        "current_year_options": CURRENT_YEAR_OPTIONS,
        "experience_level_options": EXPERIENCE_LEVEL_OPTIONS,
        "skill_confidence_options": SKILL_CONFIDENCE_OPTIONS,
        "preferred_tech_stack_options": PREFERRED_TECH_STACK_OPTIONS,
        "company_type_options": COMPANY_TYPE_OPTIONS,
        "target_role_options": TARGET_ROLE_OPTIONS,
        "timeline_options": TIMELINE_OPTIONS,
    } 