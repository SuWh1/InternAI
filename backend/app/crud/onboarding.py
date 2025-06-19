from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.models.onboarding import OnboardingData
from app.schemas.onboarding import OnboardingCreate, OnboardingUpdate

def create_onboarding_data(db: Session, user_id: uuid.UUID, onboarding_data: OnboardingCreate) -> OnboardingData:
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
    
    db_onboarding = OnboardingData(
        user_id=user_id,
        **data_dict
    )
    db.add(db_onboarding)
    db.commit()
    db.refresh(db_onboarding)
    return db_onboarding

def get_onboarding_data_by_user_id(db: Session, user_id: uuid.UUID) -> Optional[OnboardingData]:
    """Get onboarding data for a specific user."""
    return db.query(OnboardingData).filter(OnboardingData.user_id == user_id).first()

def update_onboarding_data(db: Session, user_id: uuid.UUID, onboarding_update: OnboardingUpdate) -> Optional[OnboardingData]:
    """Update onboarding data for a user."""
    db_onboarding = get_onboarding_data_by_user_id(db, user_id)
    if not db_onboarding:
        return None
    
    update_data = onboarding_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_onboarding, field, value)
    
    db.commit()
    db.refresh(db_onboarding)
    return db_onboarding

def delete_onboarding_data(db: Session, user_id: uuid.UUID) -> bool:
    """Delete onboarding data for a user."""
    db_onboarding = get_onboarding_data_by_user_id(db, user_id)
    if not db_onboarding:
        return False
    
    db.delete(db_onboarding)
    db.commit()
    return True

def has_completed_onboarding(db: Session, user_id: uuid.UUID) -> bool:
    """Check if user has completed onboarding."""
    onboarding_data = get_onboarding_data_by_user_id(db, user_id)
    return onboarding_data is not None 