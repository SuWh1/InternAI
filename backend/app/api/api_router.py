from fastapi import APIRouter
from app.api.endpoints import auth, onboarding

api_router = APIRouter()

# Include route modules
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"]) 