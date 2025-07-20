from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from app.models.onboarding import OnboardingData
from app.schemas.onboarding import OnboardingCreate, OnboardingUpdate

async def create_onboarding_data(db: AsyncSession, user_id: uuid.UUID, onboarding_data: OnboardingCreate) -> OnboardingData:
    """Create onboarding data for a user."""
    # Apply default values for empty fields to help AI
    data_dict = onboarding_data.dict()
    
    # Handle empty experience/projects
    if not data_dict.get('previous_internships') or data_dict.get('previous_internships', '').strip() == '':
        data_dict['previous_internships'] = "No previous internship experience"
    
    if not data_dict.get('projects') or data_dict.get('projects', '').strip() == '':
        data_dict['projects'] = "No experience"
    
    # Handle empty locations
    if not data_dict.get('preferred_locations') or len(data_dict.get('preferred_locations', [])) == 0:
        data_dict['preferred_locations'] = ["All locations"]
    
    # Handle empty additional info
    if not data_dict.get('additional_info') or data_dict.get('additional_info', '').strip() == '':
        data_dict['additional_info'] = "No additional info"
    
    # Handle empty frameworks and tools
    if not data_dict.get('frameworks') or len(data_dict.get('frameworks', [])) == 0:
        data_dict['frameworks'] = []
    
    if not data_dict.get('tools') or len(data_dict.get('tools', [])) == 0:
        data_dict['tools'] = []
    
    # Handle empty preferred_tech_stack (now single string)
    if not data_dict.get('preferred_tech_stack') or data_dict.get('preferred_tech_stack', '').strip() == '':
        data_dict['preferred_tech_stack'] = "Full-Stack Web Development"
    
    db_onboarding = OnboardingData(
        user_id=user_id,
        **data_dict
    )
    db.add(db_onboarding)
    await db.commit()
    await db.refresh(db_onboarding)
    return db_onboarding

async def get_onboarding_data_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[OnboardingData]:
    """Get onboarding data for a specific user."""
    result = await db.execute(select(OnboardingData).where(OnboardingData.user_id == user_id))
    return result.scalar_one_or_none()

async def update_onboarding_data(db: AsyncSession, user_id: uuid.UUID, onboarding_update: OnboardingUpdate) -> Optional[OnboardingData]:
    """Update onboarding data for a user."""
    import logging
    logger = logging.getLogger(__name__)
    
    db_onboarding = await get_onboarding_data_by_user_id(db, user_id)
    if not db_onboarding:
        return None
    
    update_data = onboarding_update.dict(exclude_unset=True)
    
    # Debug: Log what's being updated
    logger.info(f"Updating onboarding for user {user_id}: {update_data}")
    
    for field, value in update_data.items():
        old_value = getattr(db_onboarding, field, None)
        setattr(db_onboarding, field, value)
        if field in ['preferred_tech_stack', 'programming_languages', 'frameworks', 'tools']:
            logger.info(f"Updated {field}: {old_value} -> {value}")
    
    await db.commit()
    await db.refresh(db_onboarding)
    
    # Debug: Confirm the updated values were saved
    logger.info(f"Confirmed saved values - Tech Stack: {db_onboarding.preferred_tech_stack}, Languages: {db_onboarding.programming_languages}")
    
    return db_onboarding

async def delete_onboarding_data(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Delete onboarding data for a user."""
    db_onboarding = await get_onboarding_data_by_user_id(db, user_id)
    if not db_onboarding:
        return False
    
    await db.delete(db_onboarding)
    await db.commit()
    return True

async def has_completed_onboarding(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Check if user has completed onboarding."""
    onboarding_data = await get_onboarding_data_by_user_id(db, user_id)
    return onboarding_data is not None 